import { readFileSync } from "node:fs";
import path from "node:path";
import { type Harness, skillRoot } from "./_harness.js";
import { lintPrIdentity, lintPromptTemplates, REQUIRED_TEMPLATE_PHRASES, TRACKER_PROMPT_TEMPLATES } from "../../../../tooling/lib/clu-pr-lint.js";

const SCRIPT = "check-clu-pr-lint";

function requireCode(issues: ReturnType<typeof lintPrIdentity>, code: string, label: string): void {
  if (!issues.some((item) => item.code === code)) {
    throw new Error(`${label}: expected ${code}, got ${JSON.stringify(issues)}`);
  }
}

export function register(harness: Harness): void {
  harness.runScriptArgs("clu-pr-lint accepts the shipped templates with no live PR context", SCRIPT, ["--repo-root", skillRoot, "--skip-pr"], 0);

  const noId = lintPrIdentity({
    branch: "feat/share-card-import",
    title: "Share card shared import",
    body: "Implements the screen. No tracker id anywhere.",
  });
  harness.results.push({
    label: "clu-pr-lint fails a PR with no CLU id",
    ok: noId.some((item) => item.code === "clu_pr.missing_id"),
    expectedCode: 1,
    actualCode: noId.some((item) => item.code === "clu_pr.missing_id") ? 1 : 0,
    output: noId.map((item) => item.message).join("\n"),
  });

  const bodyOnly = lintPrIdentity({
    branch: "feat/share-card-import",
    title: "Share card shared import",
    body: "Fixes CLU-92. Linked only in the body.",
  });
  harness.results.push({
    label: "clu-pr-lint fails a PR that names the id only in the body",
    ok: bodyOnly.some((item) => item.code === "clu_pr.body_only_id"),
    expectedCode: 1,
    actualCode: bodyOnly.some((item) => item.code === "clu_pr.body_only_id") ? 1 : 0,
    output: bodyOnly.map((item) => item.message).join("\n"),
  });

  const doneUmbrella = lintPrIdentity({
    branch: "feat/clu-92-share-card",
    title: "CLU-92 Share card shared import",
    body: "Points at the already-Done umbrella.",
    linkedIssues: [{ id: "CLU-92", status: "Done", umbrella: true }],
  });
  harness.results.push({
    label: "clu-pr-lint fails a PR that points only at a Done umbrella",
    ok: doneUmbrella.some((item) => item.code === "clu_pr.done_umbrella_only"),
    expectedCode: 1,
    actualCode: doneUmbrella.some((item) => item.code === "clu_pr.done_umbrella_only") ? 1 : 0,
    output: doneUmbrella.map((item) => item.message).join("\n"),
  });

  const passing = lintPrIdentity({
    branch: "cursor/clu-187-pr-tracker-lint-5309",
    title: "CLU-187: Require tracker ids in branch names and PR titles",
    body: "Fixes CLU-187. Parent umbrella CLU-1 stays Done.",
    linkedIssues: [
      { id: "CLU-187", status: "In Progress", umbrella: false },
      { id: "CLU-1", status: "Done", umbrella: true },
    ],
  });
  harness.results.push({
    label: "clu-pr-lint passes a PR with CLU id in branch and title",
    ok: passing.length === 0,
    expectedCode: 0,
    actualCode: passing.length,
    output: passing.map((item) => item.message).join("\n"),
  });

  harness.runScriptArgs(
    "clu-pr-lint CLI fails a PR with no id",
    SCRIPT,
    ["--repo-root", skillRoot, "--skip-templates", "--branch", "feat/no-id", "--title", "No tracker id", "--body", "Nothing here"],
    1,
    "clu_pr.missing_id",
  );
  harness.runScriptArgs(
    "clu-pr-lint CLI fails a body-only id",
    SCRIPT,
    ["--repo-root", skillRoot, "--skip-templates", "--branch", "feat/no-id", "--title", "No tracker id", "--body", "See CLU-92"],
    1,
    "clu_pr.body_only_id",
  );
  harness.runScriptArgs(
    "clu-pr-lint CLI fails a Done-umbrella-only PR",
    SCRIPT,
    [
      "--repo-root",
      skillRoot,
      "--skip-templates",
      "--branch",
      "feat/clu-92-share-card",
      "--title",
      "CLU-92 Share card",
      "--body",
      "Umbrella only",
      "--linked-issues",
      JSON.stringify([{ id: "CLU-92", status: "Done", umbrella: true }]),
    ],
    1,
    "clu_pr.done_umbrella_only",
  );
  harness.runScriptArgs(
    "clu-pr-lint CLI passes id in branch and title",
    SCRIPT,
    ["--repo-root", skillRoot, "--skip-templates", "--branch", "cursor/clu-187-pr-tracker-lint-5309", "--title", "CLU-187: Require tracker ids"],
    0,
  );
  harness.runScriptArgs(
    "clu-pr-lint CLI exempts a stamp branch",
    SCRIPT,
    ["--repo-root", skillRoot, "--skip-templates", "--branch", "release/stamp-0.221.135", "--title", "Stamp 0.221.135"],
    0,
  );

  const unfixedRead = (relative: string): string | undefined => {
    try {
      const text = readFileSync(path.join(skillRoot, relative), "utf8");
      return REQUIRED_TEMPLATE_PHRASES.reduce((current, phrase) => current.split(phrase).join("REMOVED"), text);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  };
  const unfixed = lintPromptTemplates(skillRoot, unfixedRead);
  harness.results.push({
    label: "clu-pr-lint fails unfixed templates that lack the tracker rule",
    ok: unfixed.length === TRACKER_PROMPT_TEMPLATES.length && unfixed.every((item) => item.code === "clu_pr.template_rule_missing"),
    expectedCode: 1,
    actualCode: unfixed.some((item) => item.code === "clu_pr.template_rule_missing") ? 1 : 0,
    output: unfixed.map((item) => `${item.file}: ${item.message}`).join("\n"),
  });

  const record = (label: string, verify: () => void): void => {
    let output = "";
    try {
      verify();
    } catch (error) {
      output = String(error);
    }
    harness.results.push({ label, ok: !output, expectedCode: 0, actualCode: output ? 1 : 0, output });
  };
  record("clu-pr-lint identity helper names missing_id for an empty identity", () => {
    requireCode(noId, "clu_pr.missing_id", "no-id");
  });
  record("clu-pr-lint identity helper names body_only_id when only the body has an id", () => {
    requireCode(bodyOnly, "clu_pr.body_only_id", "body-only");
  });
  record("clu-pr-lint identity helper names done_umbrella_only for a Done umbrella", () => {
    requireCode(doneUmbrella, "clu_pr.done_umbrella_only", "done-umbrella");
  });
}
