import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { skillRoot, type Harness } from "./_harness.js";
import { resolveTsxCommand } from "../../../tooling/lib/tsx-bin.js";

// Synthetic gate controls, not Apple API responses or provider conformance evidence.
const help: Record<string, string> = {
  "validate --help": "  --version\n  --version-id\n  --deep\n  --apple-id\n",
  "--help": "  install-skills\n  telemetry\n",
  "apps --help": "  view\n  info\n",
  "auth --help": "  login\n  doctor\n  status\n",
  "metadata --help": "  pull\n  plan\n  apply\n  validate\n",
  "review --help": "  status\n  doctor\n  submissions-list\n",
  "screenshots --help": "  plan\n  apply\n  validate\n",
  "diff --help": "  localizations\n",
  "capabilities --help": "  --area\n  --status\n",
  "web privacy --help": "  catalog\n  pull\n  plan\n  apply\n  publish\n",
  "review details-get --help": "  --id\n",
};

export function register(h: Harness): void {
  const script = "checks/validation/business/store/check-asc-command-contract.ts";
  const reference = readFileSync(path.join(skillRoot, "knowledge/store/app-store-connect-cli.md"), "utf8");
  const rootFor = (name: string, text = reference): string => {
    const root = h.makeTempDir(name);
    const directory = path.join(root, "knowledge/store");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, "app-store-connect-cli.md"), text);
    return root;
  };
  const run = (root: string, preload: string) => {
    const command = resolveTsxCommand(skillRoot, [script, "--skill-root", root]);
    assert.equal(command.executable, process.execPath, "Fixture preload requires the package's Node/tsx dependency.");
    return spawnSync(command.executable, ["--import", pathToFileURL(preload).href, ...command.args], {
      cwd: skillRoot,
      encoding: "utf8",
      // The tsx CLI re-execs Node; keep the isolated ASC stub in that child as well.
      env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import=${pathToFileURL(preload).href}`.trim() },
      timeout: 20_000,
    });
  };
  const fakeCli = (name: string, version: string | null, outputs: Record<string, string>) => {
    const directory = h.makeTempDir(name);
    const trace = path.join(directory, "calls.jsonl");
    const preload = path.join(directory, "asc-fixture.mjs");
    writeFileSync(
      preload,
      `import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { appendFileSync } from "node:fs";
const original = childProcess.spawnSync;
childProcess.spawnSync = (command, args, options) => {
  if (command !== "asc") return original(command, args, options);
  appendFileSync(${JSON.stringify(trace)}, JSON.stringify(args) + "\\n");
  const version = ${JSON.stringify(version)};
  if (version === null) return { status: null, error: Object.assign(new Error("fixture: ASC absent"), { code: "ENOENT" }) };
  const output = args.join(" ") === "--version" ? version : ${JSON.stringify(outputs)}[args.join(" ")];
  return { status: output === undefined ? 2 : 0, stdout: output ?? "", stderr: "" };
};
syncBuiltinESMExports();
`,
    );
    return { preload, trace };
  };
  const absent = fakeCli("asc-absent", null, {});
  h.check("ASC contract keeps offline guidance checks available without CLI or account access", () => {
    const result = run(rootFor("asc-offline"), absent.preload);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });
  h.check("ASC contract rejects missing privacy plan guidance without CLI or account access", () => {
    const result = run(rootFor("asc-missing-privacy-plan", reference.replaceAll("asc web privacy plan", "removed privacy plan")), absent.preload);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /asc_command_contract.current_asc_web_privacy_plan_missing/);
  });
  h.check("ASC contract still rejects known-invalid commands in nested guidance", () => {
    const root = rootFor("asc-stale-command");
    writeFileSync(path.join(root, "knowledge/store/other.md"), "```bash\nasc validate app-store-version --app 123456789\n```\n");
    const result = run(root, absent.preload);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /asc_command_contract.stale_asc_validate_app_store_version/);
  });

  h.check("ASC 5.7 contract checks privacy/readiness help without probing authentication or mutating", () => {
    const fake = fakeCli("asc-current", "5.7.0 (fixture)", help);
    const result = run(rootFor("asc-current-root"), fake.preload);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const calls = readFileSync(fake.trace, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as string[]);
    assert(calls.some((args) => args.join(" ") === "web privacy --help"));
    assert(calls.some((args) => args.join(" ") === "capabilities --help"));
    assert(calls.every((args) => args.join(" ") === "--version" || args.at(-1) === "--help"));
  });
  h.check("ASC 5.7 contract fails when deep readiness validation disappears", () => {
    const fake = fakeCli("asc-no-deep", "5.7.0", { ...help, "validate --help": "  --version\n  --version-id\n  --apple-id\n" });
    const result = run(rootFor("asc-no-deep-root"), fake.preload);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /asc_command_contract.live_help_deep_missing/);
  });
  h.check("ASC 5.7 contract fails when privacy planning disappears", () => {
    const fake = fakeCli("asc-no-plan", "5.7.0", { ...help, "web privacy --help": "  catalog\n  pull\n  apply\n  publish\n" });
    const result = run(rootFor("asc-no-plan-root"), fake.preload);
    assert.equal(result.status, 1);
    assert.match(result.stdout + result.stderr, /asc_command_contract.live_help_plan_missing/);
  });
  h.check("ASC older API-only 5.x clients do not require the 5.7 web/readiness additions", () => {
    const fake = fakeCli("asc-older", "5.6.0", { ...help, "validate --help": "  --version\n  --version-id\n" });
    const result = run(rootFor("asc-older-root"), fake.preload);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert(!readFileSync(fake.trace, "utf8").includes("privacy"));
  });
}
