#!/usr/bin/env node
// Deterministic, network-free CLI stand-in. It exercises the production executor
// protocol and process separation without representing a model or live Codex run.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");

if (process.argv.includes("--version")) {
  console.log("deterministic-consumer-repair-fixture 1");
  process.exit(0);
}
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "scenario.json"), "utf8"));
const workspace = process.cwd();
const source = path.join(workspace, "app/progress.cjs");
const prompt = process.argv.at(-1);
const reviewing = prompt.includes("BEGIN_VERIFICATION_VERDICT");
const begin = "BEGIN_KNOWLEDGE_RECEIPT";
const end = "END_KNOWLEDGE_RECEIPT";
const receipt = reviewing ? undefined : JSON.parse(prompt.slice(prompt.lastIndexOf(begin) + begin.length, prompt.lastIndexOf(end)).trim());
const workflowId = reviewing ? prompt.match(/WORKFLOW UNDER REVIEW: ([^ ]+)/)[1] : receipt.workflowId;
const repairing = workflowId === "workflow.repair-progress";
const event = {
  kind: reviewing ? "reviewer" : "worker",
  workflowId,
  pid: process.pid,
  repairInstructionsReceived: prompt.includes("Repair finding from"),
};
const digest = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const record = () => fs.appendFileSync(config.eventsPath, `${JSON.stringify({ ...event, sourceSha256: digest(source) })}\n`);
const check = () => {
  const result = spawnSync(process.execPath, [config.checkerPath, source], { encoding: "utf8", timeout: 5000 });
  if (result.error || (result.status !== 0 && result.status !== 1)) throw new Error(`Behavioral checker failed to run: ${result.stderr}`);
  return JSON.parse(result.stdout);
};

if (reviewing) {
  if (repairing && config.mode === "missing-reviewer") {
    event.unavailable = true;
    record();
    console.error("Deterministic reviewer unavailable control");
    process.exit(2);
  }
  const result = repairing ? check() : JSON.parse(fs.readFileSync(path.join(workspace, "evidence/observation.json"), "utf8")).checks;
  const observation = repairing ? undefined : JSON.parse(fs.readFileSync(path.join(workspace, "evidence/observation.json"), "utf8"));
  const accepted = repairing ? result.passed : observation.sourceSha256 === config.originalSha256 && !result.passed && result.rows.some((row) => !row.passed);
  const failures = result.rows.filter((row) => !row.passed);
  event.accepted = accepted;
  event.assertions = result.rows.length;
  event.failures = failures;
  record();
  console.log("BEGIN_VERIFICATION_VERDICT");
  console.log(
    JSON.stringify({
      schemaVersion: "1.0.0",
      workflowId,
      verdict: accepted ? "accepted" : "rejected",
      evidence: !repairing
        ? "Checked original progress source identity and recorded behavioral failures."
        : accepted
          ? "Executed ten behavioral assertions against current source in a separate process; all passed."
          : `Current source failed behavioral assertions: ${JSON.stringify(failures)}`,
      repairWorkflowIds: accepted ? [] : [workflowId],
    }),
  );
  console.log("END_VERIFICATION_VERDICT");
} else {
  if (repairing && config.mode === "worker-failure") {
    event.failed = true;
    record();
    console.error("Deterministic producer failure control");
    process.exit(2);
  }
  if (!repairing) {
    fs.mkdirSync(path.join(workspace, "evidence"), { recursive: true });
    fs.writeFileSync(path.join(workspace, "evidence/observation.json"), `${JSON.stringify({ sourceSha256: digest(source), checks: check() }, null, 2)}\n`);
  } else if (config.mode === "bogus") {
    fs.writeFileSync(source, "module.exports = () => 50;\n");
  } else if (config.mode !== "unchanged" && (config.mode !== "repair-after-review" || event.repairInstructionsReceived)) {
    fs.copyFileSync(config.fixedSourcePath, source);
  }
  record();
  for (const input of [...receipt.taskArtifacts, ...receipt.contractFiles]) input.sha256 = `sha256:${digest(path.join(workspace, input.path))}`;
  for (const output of receipt.outputEvidence) {
    output.knowledgePaths = receipt.taskArtifacts.map((input) => input.path);
    output.summary = repairing
      ? "Applied the current repair instructions to the daily plan progress source."
      : "Executed the original source and recorded its identity and failing behavioral cases.";
  }
  console.log(`${begin}\n${JSON.stringify(receipt)}\n${end}`);
}
