import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { packageFiles, pluginRoot, safeFile, validate } from "../scripts/validate.mjs";
import { probe } from "../scripts/probe.mjs";
import { cases, commonPrompt, prepare, summarize, dimensions } from "../evals/eval.mjs";

function copyPackage(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "brigade-package-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of packageFiles(pluginRoot)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(pluginRoot, file), path.join(root, file));
  }
  return root;
}
function mutate(root, file, change) {
  const location = path.join(root, file);
  const json = JSON.parse(fs.readFileSync(location, "utf8"));
  change(json);
  fs.writeFileSync(location, JSON.stringify(json));
}

test("portable package is valid while incomplete submission metadata fails closed", async () => {
  assert.equal((await validate()).formatAndLocalSafety, "passed");
  await assert.rejects(validate(pluginRoot, { submission: true }), /Submission metadata held/);
});
test("manifest cannot add a hook or registered personal app mapping", async (t) => {
  for (const field of ["apps", "hooks"]) {
    const root = copyPackage(t);
    mutate(root, "plugin.json", (manifest) => { manifest.extensions["com.openai"][field] = "./extra.json"; });
    await assert.rejects(validate(root), /app mappings or hooks/);
  }
});
test("MCP wiring rejects credentials, alternate endpoints, and multiple servers", async (t) => {
  for (const change of [
    (mcp) => { mcp.mcpServers["brigade-knowledge"].headers = { Authorization: "Bearer synthetic-test-only" }; },
    (mcp) => { mcp.mcpServers["brigade-knowledge"].url = "https://other.example/mcp"; },
    (mcp) => { mcp.mcpServers.second = { type: "streamable-http", url: "https://other.example/mcp" }; }
  ]) {
    const root = copyPackage(t);
    mutate(root, "mcp.json", change);
    await assert.rejects(validate(root));
  }
});
test("asset paths reject traversal and symlink escapes", (t) => {
  const root = copyPackage(t);
  assert.throws(() => safeFile(root, "./assets/../../outside"), /not canonical/);
  fs.symlinkSync(os.tmpdir(), path.join(root, "assets", "outside"));
  assert.throws(() => packageFiles(root), /symlinks/);
});
test("active SVG content is rejected", async (t) => {
  const root = copyPackage(t);
  const icon = path.join(root, "assets", "icon.svg");
  fs.writeFileSync(icon, fs.readFileSync(icon, "utf8").replace("</svg>", "<script>alert(1)</script></svg>"));
  await assert.rejects(validate(root), /Active or remote SVG/);
});
test("a separate composer icon also rejects active SVG content", async (t) => {
  const root = copyPackage(t);
  const icon = path.join(root, "assets", "composer.svg");
  fs.writeFileSync(icon, '<svg viewBox="0 0 128 128"><script>synthetic()</script></svg>');
  mutate(root, "plugin.json", (manifest) => { manifest.extensions["com.openai"].interface.composerIcon = "./assets/composer.svg"; });
  await assert.rejects(validate(root), /Active or remote SVG/);
});
test("allowed skill YAML receives the protected-content scan", async (t) => {
  for (const yaml of ['client_secret: "synthetic-fixture-only"', "client_secret: synthetic_fixture_only_not_a_real_secret", 'nested:\n  "client_secret": "synthetic-fixture-only"']) {
    const root = copyPackage(t);
    fs.writeFileSync(path.join(root, "skills", "audit-first-five-minutes", "metadata.yaml"), yaml);
    await assert.rejects(validate(root), /Credential material/);
  }
});
test("quoted JSON credential fields are rejected recursively", async (t) => {
  const root = copyPackage(t);
  mutate(root, "plugin.json", (manifest) => { manifest.author.extra = { client_secret: "synthetic-fixture-only" }; });
  await assert.rejects(validate(root), /Credential material/);
});
test("hidden files and unintended executables cannot enter the ZIP", (t) => {
  for (const name of [".env.md", "upload.mjs"]) {
    const root = copyPackage(t);
    fs.writeFileSync(path.join(root, "skills", "audit-first-five-minutes", name), "synthetic fixture only");
    assert.throws(() => packageFiles(root), /Hidden package file|Unexpected package file type/);
  }
});
test("review case count is enforced", async (t) => {
  const root = copyPackage(t);
  mutate(root, "plugin.json", (manifest) => { manifest.extensions["com.openai"].review.test_cases.negative.pop(); });
  await assert.rejects(validate(root), /five positive and three negative/);
});
test("public probe cannot register a client, exchange tokens, or send authorization", async () => {
  const calls = [];
  const metadata = {
    "/health": { engineVersion: "test-fixture" },
    "/.well-known/oauth-protected-resource": { resource: "https://mcp.clueless-creations.com/mcp", scopes_supported: ["b2c:read"] },
    "/.well-known/oauth-authorization-server": { issuer: "https://mcp.clueless-creations.com", code_challenge_methods_supported: ["S256"], registration_endpoint: "https://mcp.clueless-creations.com/oauth/register" }
  };
  const result = await probe(async (url, options) => {
    calls.push({ url, options });
    const route = new URL(url).pathname;
    return new Response(JSON.stringify(metadata[route] ?? {}), { status: route === "/mcp" ? 401 : 200, headers: { "www-authenticate": "Bearer resource_metadata=test" } });
  });
  assert.equal(result.resourceMatchesEndpoint, true);
  assert.equal(calls.length, 4);
  assert.equal(calls.filter(({ options }) => options.method === "POST").length, 1);
  assert(calls.every(({ url, options }) => !/\/oauth\/(?:register|token|authorize)/.test(url) && !options.headers?.Authorization));
  assert.equal(JSON.parse(calls.at(-1).options.body).method, "initialize");
});
test("both eval arms share a competent prompt without rater answers", () => {
  assert.equal(cases.length, 8);
  for (const testCase of cases) {
    const prompt = commonPrompt(testCase);
    assert(!prompt.includes("expected:") && !prompt.includes("forbidden:"));
    assert(prompt.includes("when supported"));
    for (const frame of testCase.frames) {
      const bytes = fs.readFileSync(path.join(pluginRoot, "evals", "fixtures", frame.id + ".png"));
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    }
  }
});
function evaluation(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "brigade-eval-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const out = path.join(base, "run");
  prepare(out);
  const read = (name) => JSON.parse(fs.readFileSync(path.join(out, name + ".json"), "utf8"));
  return { plan: read("plan"), runs: read("runs"), ratings: read("ratings"), out };
}
test("unrun evaluation returns null scores and preserves the empty evidence state", (t) => {
  const { plan, runs, ratings } = evaluation(t);
  const result = summarize(plan, runs, ratings);
  assert.equal(result.status, "not_run");
  assert.equal(result.scores, null);
  assert.equal(result.actualOutputs, 0);
  assert(Object.values(plan.protocolHashes).every((value) => /^[a-f0-9]{64}$/.test(value)));
});
test("negative cases cannot be omitted or converted into positive cases", (t) => {
  const { plan, runs, ratings } = evaluation(t);
  const removed = { ...plan, cases: plan.cases.filter((testCase) => testCase.kind === "positive") };
  assert.throws(() => summarize(removed, runs.filter((run) => run.caseId.startsWith("P")), ratings), /complete frozen case set/);
  plan.cases.find((testCase) => testCase.id === "N1").kind = "positive";
  assert.throws(() => summarize(plan, runs, ratings), /cannot be removed or reclassified/);
});
test("evaluation rejects unequal evidence and duplicate or switched run identities", (t) => {
  const { plan, runs, ratings } = evaluation(t);
  runs[0].status = "complete";
  runs[0].inputSha256 = "different-capture";
  assert.throws(() => summarize(plan, runs, ratings), /Input bytes differ/);
  runs[0].inputSha256 = plan.cases[0].inputSha256;
  runs[0].arm = runs[0].arm === "plugin" ? "baseline" : "plugin";
  assert.throws(() => summarize(plan, runs, ratings), /Run identity mismatch/);
});
function completeFixture(t) {
  // Fabricated data exists only to test arithmetic and guards. It is never an empirical result.
  const { plan, runs, ratings } = evaluation(t);
  plan.model = "synthetic-unit-fixture";
  plan.settings = { budget: "test" };
  for (const run of runs) Object.assign(run, { model: plan.model, settings: plan.settings, surface: "ChatGPT", freshSession: true, status: "complete", output: "synthetic scorer fixture", toolTranscript: [] });
  for (const rating of ratings) {
    const run = runs.find((candidate) => candidate.id === rating.runId);
    rating.scores = Object.fromEntries(dimensions.map((dimension) => [dimension, run.arm === "plugin" ? 2 : 1]));
    rating.negativePass = true;
    rating.rationale = "Unit-fixture arithmetic only; not an audit evaluation.";
  }
  return { plan, runs, ratings };
}
test("complete synthetic scorer fixture enforces negative gates and model parity", (t) => {
  const { plan, runs, ratings } = completeFixture(t);
  assert.equal(summarize(plan, runs, ratings).continuePilot, true);
  ratings.find((rating) => rating.runId.startsWith("N2") && rating.runId.endsWith("plugin")).negativePass = false;
  assert.equal(summarize(plan, runs, ratings).continuePilot, false);
  runs[0].model = "other-model";
  assert.equal(summarize(plan, runs, ratings).status, "incomplete_or_incomparable");
});
test("omitted settings and input hashes cannot pass the comparison", (t) => {
  const { plan, runs, ratings } = completeFixture(t);
  delete plan.settings;
  for (const run of runs) delete run.settings;
  const result = summarize(plan, runs, ratings);
  assert.equal(result.status, "incomplete_or_incomparable");
  assert.equal(result.scores, null);
  for (const testCase of plan.cases) delete testCase.inputSha256;
  for (const run of runs) delete run.inputSha256;
  assert.throws(() => summarize(plan, runs, ratings), /valid SHA-256/);
});
test("a critical failure in either arm holds comparative scores", (t) => {
  for (const arm of ["baseline", "plugin"]) {
    const { plan, runs, ratings } = completeFixture(t);
    ratings.find((rating) => rating.runId.endsWith(arm)).criticalFailures = ["Synthetic guard fixture only"];
    const result = summarize(plan, runs, ratings);
    assert.equal(result.status, "incomplete_or_incomparable");
    assert.equal(result.scores, null);
  }
});
test("ZIP is reproducible and excludes evaluation fixtures and local secrets", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "brigade-zip-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const one = path.join(base, "one.zip"), two = path.join(base, "two.zip");
  const script = path.join(pluginRoot, "scripts", "package.py");
  for (const out of [one, two]) {
    const run = spawnSync("python3", [script, out], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
  }
  assert.deepEqual(fs.readFileSync(one), fs.readFileSync(two));
  const listing = spawnSync("python3", ["-c", "import sys,zipfile; print('\\n'.join(zipfile.ZipFile(sys.argv[1]).namelist()))", one], { encoding: "utf8" });
  assert.equal(listing.status, 0);
  assert(listing.stdout.includes("plugin.json\n"));
  assert(!/evals\/|tests\/|scripts\/|\.env|auth\.json|\.git/.test(listing.stdout));
});
