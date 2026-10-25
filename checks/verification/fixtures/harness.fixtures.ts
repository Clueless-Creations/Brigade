import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseShardOutput } from "../../../tooling/lib/shard-pool.js";
import { assert, skillRoot, type CaseResult, type Harness } from "./_harness.js";

const asyncProbe = `
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assert } from "./_harness.js";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function register(harness) {
  console.log("HARNESS_TEMP_ROOT:" + harness.tempRoot);
  const dir = harness.makeTempDir("async-case");
  let synchronousFinished = false;
  harness.check("sync first", () => { synchronousFinished = true; });
  assert(synchronousFinished && harness.results[0].ok, "synchronous checks must finish immediately");
  let firstFinished = false;
  harness.check("slow async success", async () => {
    await delay(25);
    assert(existsSync(dir), "temporary directory was removed before async completion");
    writeFileSync(path.join(dir, "completed.mjs"), 'console.log("async artifact completed")');
    firstFinished = true;
  });
  assert(harness.results[1].ok === false, "a pending case must not be marked as passed");
  let cleanupRefused = false;
  try { harness.cleanup(); } catch (error) { cleanupRefused = error.message.includes("pending fixture checks"); }
  assert(cleanupRefused && existsSync(dir), "early cleanup must refuse pending work and preserve its files");
  harness.runScript("script after async", path.join(dir, "completed.mjs"), [], 0, "async artifact completed");
  harness.check("sync after async", () => {
    assert(firstFinished, "a later synchronous case overtook the pending async case");
  });
  harness.check("async rejection", async () => {
    await delay(5);
    throw new Error("delayed assertion failed");
  });
  harness.skip("skip control", "probe subject absent");
  harness.check("async success after rejection", async () => {
    await delay(1);
    assert(existsSync(dir), "temporary directory was removed before the last case");
  });
}
`;

// Copy the actual owners into an isolated layout so each CLI mode discovers only the probe.
// This never invokes this regression suite recursively or edits the source checkout's suites.
function probeRunner(harness: Harness, name: string, source: string): string {
  const root = harness.makeTempDir(name);
  const fixtures = path.join(root, "checks/verification/fixtures");
  mkdirSync(fixtures, { recursive: true });
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ type: "module" }));
  for (const directory of ["kernel", "tooling"]) {
    symlinkSync(path.join(skillRoot, directory), path.join(root, directory), "junction");
  }
  mkdirSync(path.join(root, "node_modules/.bin"), { recursive: true });
  for (const dependency of ["ajv", "tsx"]) {
    symlinkSync(path.join(skillRoot, "node_modules", dependency), path.join(root, "node_modules", dependency), "junction");
  }
  // The probe uses Node's supported loader in every child, including parallel shards.
  // This avoids the tsx CLI's unrelated IPC socket requirement in restricted environments.
  writeFileSync(
    path.join(root, "node_modules/.bin/tsx"),
    `#!/usr/bin/env node
    import { spawnSync } from "node:child_process";
    const child = spawnSync(process.execPath, ["--import", "tsx", ...process.argv.slice(2)], { stdio: "inherit" });
    process.exitCode = child.status ?? 1;
  `,
    { mode: 0o755 },
  );
  for (const file of ["_harness.ts", "run.ts"]) {
    copyFileSync(path.join(skillRoot, "checks/verification/fixtures", file), path.join(fixtures, file));
  }
  writeFileSync(path.join(fixtures, "probe.fixtures.ts"), source);
  return path.join(fixtures, "run.ts");
}

function runProbe(runner: string, args: string[]): { code: number | null; output: string } {
  const child = spawnSync(process.execPath, ["--import", "tsx", runner, ...args], {
    cwd: skillRoot,
    env: { ...process.env, TMPDIR: path.dirname(runner), TEMP: path.dirname(runner), TMP: path.dirname(runner) },
    encoding: "utf8",
    timeout: 15_000,
  });
  assert(!child.error, `probe process failed: ${child.error?.message}`);
  assert(child.signal === null, `probe process terminated with signal ${child.signal}`);
  return { code: child.status, output: `${child.stdout}\n${child.stderr}` };
}

function assertCleaned(runner: string): void {
  const remaining = readdirSync(path.dirname(runner)).filter((name) => name.startsWith("b2c-core-fixtures-"));
  assert(remaining.length === 0, `probe did not clean up its temporary directories: ${remaining.join(", ")}`);
}

export function register(harness: Harness): void {
  const runner = probeRunner(harness, "async-harness", asyncProbe);
  for (const [mode, args] of [
    ["named", ["probe"]],
    ["serial", ["--serial"]],
    ["parallel", []],
  ] as const) {
    harness.check(`harness: ${mode} CLI awaits async results and cleanup`, () => {
      const result = runProbe(runner, [...args]);
      assert(result.code === 1, `expected a failing suite exit, got ${result.code}:\n${result.output}`);
      assert(result.output.includes("1 failure(s), 5 passed, 1 skipped"), result.output);
      const rows = result.output.split("\n").filter((line) => /^(PASS|FAIL|SKIP) /.test(line));
      assert(
        JSON.stringify(rows) ===
          JSON.stringify([
            "PASS sync first",
            "PASS slow async success",
            "PASS script after async",
            "PASS sync after async",
            "FAIL async rejection",
            "SKIP skip control",
            "PASS async success after rejection",
          ]),
        `case results must retain registration order and actual outcomes:\n${result.output}`,
      );
      assert(result.output.includes("delayed assertion failed"), result.output);
      assertCleaned(runner);
    });
  }

  harness.check("harness: shard marker contains settled results and async rejection details", () => {
    const result = runProbe(runner, ["--shard", "probe"]);
    assert(result.code === 0, `reported failures belong in the shard payload, not an unhandled rejection:\n${result.output}`);
    const results = parseShardOutput(result.output).results as CaseResult[] | undefined;
    assert(results?.length === 7, `expected seven settled shard results:\n${result.output}`);
    assert(results.filter((entry) => !entry.ok).length === 1, `expected one failed assertion:\n${result.output}`);
    assert(results[4]!.label === "async rejection" && results[4]!.detail === "delayed assertion failed", result.output);
    assert(results[5]!.skipped === true, result.output);
    assertCleaned(runner);
  });

  harness.check("harness: nested async work registered before the first await is retained", () => {
    const nestedRunner = probeRunner(
      harness,
      "nested-check",
      `
      import { existsSync } from "node:fs";
      import { assert } from "./_harness.js";
      export function register(harness) {
        let innerFinished = false;
        harness.check("outer async", async () => {
          harness.check("nested async", async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            assert(existsSync(harness.tempRoot), "cleanup overtook nested work");
            innerFinished = true;
          });
          await new Promise((resolve) => setTimeout(resolve, 1));
        });
        harness.check("after nested async", () => {
          assert(innerFinished, "a later callback overtook nested work");
        });
      }
    `,
    );
    const result = runProbe(nestedRunner, ["probe"]);
    assert(result.code === 0 && result.output.includes("0 failure(s), 3 passed"), result.output);
    assertCleaned(nestedRunner);
  });

  harness.check("harness: registration failure drains pending checks before cleanup", () => {
    const throwingRunner = probeRunner(
      harness,
      "throwing-registration",
      `
      import { existsSync } from "node:fs";
      import { assert } from "./_harness.js";
      export function register(harness) {
        console.log("HARNESS_TEMP_ROOT:" + harness.tempRoot);
        harness.check("pending at registration failure", async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          assert(existsSync(harness.tempRoot), "cleanup overtook the pending case");
          console.log("PENDING_CASE_FINISHED");
        });
        throw new Error("registration failed deliberately");
      }
    `,
    );
    const result = runProbe(throwingRunner, ["--shard", "probe"]);
    assert(result.code !== 0, result.output);
    assert(result.output.includes("registration failed deliberately"), result.output);
    assert(result.output.includes("PENDING_CASE_FINISHED"), `the pending case must complete despite registration failure:\n${result.output}`);
    assert(parseShardOutput(result.output).results === undefined, "registration failure must not emit a passing shard payload");
    assertCleaned(throwingRunner);
  });

  harness.check("harness: unresolved async work cannot emit a passing shard marker", () => {
    const unresolvedRunner = probeRunner(
      harness,
      "unresolved-check",
      `
      export function register(harness) {
        harness.check("never settles", () => new Promise(() => {}));
      }
    `,
    );
    const result = runProbe(unresolvedRunner, ["--shard", "probe"]);
    assert(result.code !== 0, `an unsettled top-level await must fail the child:\n${result.output}`);
    assert(parseShardOutput(result.output).results === undefined, `pending work must not appear as a passing shard:\n${result.output}`);
  });
}
