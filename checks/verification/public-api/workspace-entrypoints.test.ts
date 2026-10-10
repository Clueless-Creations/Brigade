import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { parse, stringify } from "yaml";
import { loadProductInstanceDocument } from "../../../catalog/ontology/instance-load.js";
import { renderProductMarkdown } from "../../../catalog/ontology/render-product.js";
import { acquireLock, releaseLock } from "../../../kernel/reducer/lock.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const cli = path.join(root, "entrypoints/cli/b2c.mjs");
const guides = ["AGENTS.md", "CLAUDE.md", ".cursor/rules/agents.mdc"];

function fixture() {
  const temp = mkdtempSync(path.join(tmpdir(), "b2c-entrypoint-cli-"));
  return { temp, home: path.join(temp, "home"), workspace: path.join(temp, "workspace") };
}
type Fixture = ReturnType<typeof fixture>;
function run(env: Fixture, args: string[], timeoutMs?: number) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: env.temp,
    env: { ...process.env, B2C_APP_BUILDER_HOME: env.home },
    encoding: "utf8",
    timeout: timeoutMs ?? (args[0] === "business-initialize" ? 120_000 : 60_000),
  });
  assert.equal(result.error, undefined, result.error?.message ?? "");
  return result;
}
function json(env: Fixture, args: string[], expectedCode = 0, timeoutMs?: number) {
  const result = run(env, [...args, "--json"], timeoutMs);
  assert.equal(result.status, expectedCode, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}
function create(env: Fixture): void {
  const result = json(env, [
    "business-create",
    "--workspace",
    "app",
    "--directory",
    env.workspace,
    "--name",
    "Weekend Walks",
    "--hypothesis",
    "Help neighbors choose a short local walk",
  ]);
  assert.equal(result.ok, true);
}
/** Includes directory names so read-only calls cannot quietly create lock/runtime folders. */
function snapshot(directory: string): Record<string, string> {
  const entries: Record<string, string> = {};
  function visit(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(current, entry.name);
      const relative = path.relative(directory, file).split(path.sep).join("/");
      entries[relative] = entry.isDirectory() ? "directory" : entry.isFile() ? readFileSync(file).toString("base64") : "special";
      if (entry.isDirectory()) visit(file);
    }
  }
  visit(directory);
  return entries;
}
function assertPlanningOnly(env: Fixture): void {
  for (const relative of ["catalog.json", ".b2c-launch/runtime.json", "state", "control", ".claude"])
    assert.equal(existsSync(path.join(env.workspace, relative)), false, `${relative} must not be created by guidance refresh`);
}
function assertBoundedReport(env: Fixture, report: unknown): void {
  const serialized = JSON.stringify(report);
  assert(serialized.length < 8_192, "guidance report should remain bounded");
  for (const privateText of [env.temp, env.workspace, env.home, "CUSTOM-WALK-REQUIREMENT"])
    assert.equal(serialized.includes(privateText), false, "guidance reports must omit filesystem paths and authored content");
}

test("business-create installs current startup routing before runtime initialization", () => {
  const env = fixture();
  try {
    create(env);
    const before = snapshot(env.temp);
    for (const operation of ["business-status", "business-plan"]) {
      const result = json(env, [operation, "--workspace", "app"]);
      assert.equal(result.ok, true);
      assert.deepEqual(result.warnings, []);
      assert.equal(result.data.lifecycle ?? result.data.status, "not_initialized");
    }
    const preview = json(env, ["refresh-entrypoints", "--workspace", "app"]);
    assert.equal(preview.status, "current");
    assert.equal(preview.changed, false);
    assert.equal(preview.applied, false);
    assert.deepEqual(snapshot(env.temp), before);
    const agents = readFileSync(path.join(env.workspace, "AGENTS.md"), "utf8");
    assert.match(agents, /Weekend Walks/);
    assert.match(agents, /`brigade` skill/);
    assert(agents.indexOf("b2c business-status") < agents.indexOf("b2c business-plan"));
    for (const relative of guides) assert(existsSync(path.join(env.workspace, relative)));
    assertPlanningOnly(env);
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("CLI and MCP warn on missing or stale guidance without writes; explicit refresh preserves active app instructions", async () => {
  const env = fixture();
  const client = new Client({ name: "workspace-guidance-parity", version: "1.0.0" });
  try {
    create(env);
    const custom = "# Local app instructions\n\nCUSTOM-WALK-REQUIREMENT: Keep the route usable offline.\n";
    writeFileSync(path.join(env.workspace, "AGENTS.md"), custom);
    rmSync(path.join(env.workspace, "CLAUDE.md"));
    const before = snapshot(env.temp);
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", path.join(root, "entrypoints/mcp/server.ts")],
        cwd: root,
        env: { ...process.env, B2C_APP_BUILDER_HOME: env.home, B2C_APP_BUILDER_MCP_READONLY: "1" },
        stderr: "pipe",
      }),
    );
    for (const operation of ["status", "plan"]) {
      const result = json(env, [`business-${operation}`, "--workspace", "app"]);
      assert.equal(result.ok, true);
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0], /AGENTS\.md: stale/);
      assert.match(result.warnings[0], /CLAUDE\.md: missing/);
      assert.match(result.warnings[0], /refresh-entrypoints --workspace app/);
      assert.equal(result.data.lifecycle ?? result.data.status, "not_initialized");
      assertBoundedReport(env, result.warnings);
      const mcp = await client.callTool({ name: `b2c_business_${operation}`, arguments: { workspaceId: "app" } });
      const body = mcp.structuredContent as { warnings: string[]; data: unknown };
      assert.deepEqual(body.warnings, result.warnings);
      assert.deepEqual(body.data, result.data);
    }
    const preview = json(env, ["refresh-entrypoints", "--workspace", "app"]);
    assert.equal(preview.changed, true);
    assert.equal(preview.applied, false);
    assertBoundedReport(env, preview);
    assert.deepEqual(snapshot(env.temp), before, "status, plan, MCP and preview must be passive");

    const applied = json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"]);
    assert.equal(applied.status, "current");
    assert.equal(applied.applied, true);
    assertBoundedReport(env, applied);
    const after = snapshot(env.temp);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((file) => before[file] !== after[file]);
    assert.deepEqual(changed.sort(), ["workspace/AGENTS.md", "workspace/CLAUDE.md"]);
    assert(readFileSync(path.join(env.workspace, "AGENTS.md"), "utf8").startsWith(custom), "app instructions must remain active in the root guide");
    assertPlanningOnly(env);
    for (const operation of ["business-status", "business-plan"]) assert.deepEqual(json(env, [operation, "--workspace", "app"]).warnings, []);
    const again = json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"]);
    assert.equal(again.changed, false);
    assert.deepEqual(snapshot(env.temp), after, "repeat refresh must be idempotent");
  } finally {
    await client.close();
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("initialized workspaces receive guidance warnings and refresh without changing runtime or authority", () => {
  const env = fixture();
  try {
    create(env);
    const file = path.join(env.workspace, "product.yaml");
    const product = parse(readFileSync(file, "utf8"));
    product.meta.status = "accepted";
    writeFileSync(file, stringify(product));
    writeFileSync(path.join(env.workspace, "PRODUCT.md"), renderProductMarkdown(loadProductInstanceDocument(file)));
    const plan = json(env, ["business-plan", "--workspace", "app"]);
    assert.equal(json(env, ["business-initialize", "--workspace", "app", "--revision", plan.data.revision]).ok, true);
    const healthyPlan = json(env, ["business-plan", "--workspace", "app"]);
    rmSync(path.join(env.workspace, "CLAUDE.md"));
    const before = snapshot(env.temp);
    for (const operation of ["business-status", "business-plan"]) {
      const result = json(env, [operation, "--workspace", "app"]);
      assert.equal(result.ok, true);
      assert.match(result.warnings.join("\n"), /CLAUDE\.md: missing/);
      if (operation === "business-plan") {
        assert.deepEqual(result.data.ready, healthyPlan.data.ready);
        assert.deepEqual(result.data.held, healthyPlan.data.held);
        assert.equal(result.data.authorityGranted, false);
      }
    }
    assert.deepEqual(snapshot(env.temp), before);
    assert.equal(json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"]).status, "current");
    const after = snapshot(env.temp);
    const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((file) => before[file] !== after[file]);
    assert.deepEqual(changed, ["workspace/CLAUDE.md"]);
    assert.deepEqual(json(env, ["business-status", "--workspace", "app"]).warnings, []);
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("refresh respects the active session lock and pending recovery without replacing guides", () => {
  const env = fixture();
  try {
    create(env);
    rmSync(path.join(env.workspace, "CLAUDE.md"));
    const lock = path.join(env.workspace, "control/session.lock");
    assert.equal(acquireLock(lock, { ownerSessionId: "existing-session", ttlSeconds: 300, retries: 0 }).ok, true);
    const locked = snapshot(env.temp);
    const refused = json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"], 1);
    assert.equal(refused.error, "entrypoints.session_lock_unavailable");
    assertBoundedReport(env, refused);
    assert.deepEqual(snapshot(env.temp), locked);
    releaseLock(lock, "existing-session");

    for (const [relative, expected] of [
      [".b2c-launch/initialization.json", "business.initialization_incomplete"],
      [".b2c-launch/composition-activation.json", "composition.activation_incomplete"],
      ["control/erasure-intent.json", "erasure.pending_transition"],
    ]) {
      const journal = path.join(env.workspace, relative!);
      mkdirSync(path.dirname(journal), { recursive: true });
      writeFileSync(journal, "{}\n");
      const before = snapshot(env.temp);
      const result = json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"], 1);
      assert.equal(result.error, expected);
      assertBoundedReport(env, result);
      assert.deepEqual(snapshot(env.temp), before, "refused refresh must preserve the recovery journal and every guide");
      rmSync(journal);
    }
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("refresh rejects malformed arguments and keeps help and refusal output free of workspace content", () => {
  const env = fixture();
  try {
    create(env);
    const before = snapshot(env.temp);
    for (const args of [
      ["--workspace", "app", "--apply", "--apply"],
      ["--workspace", "app", "--unexpected"],
      ["--workspace"],
      ["--workspace", "app", "--workspace", "app"],
      ["--workspace", "unknown"],
      ["--apply"],
    ]) {
      const result = json(env, ["refresh-entrypoints", ...args], 1);
      assert.equal(result.ok, false);
      if (args[1] === "unknown") assert.equal(result.status, "unsafe");
      else assert.match(result.error, /^entrypoints\./, `unexpected refusal for ${args.join(" ")}`);
      assertBoundedReport(env, result);
    }
    for (const flag of ["--help", "-h"]) {
      const result = run(env, ["refresh-entrypoints", flag]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Usage: b2c refresh-entrypoints/);
      assert.match(result.stdout, /runtime pins, permissions and business state are unchanged/);
    }
    assert.deepEqual(snapshot(env.temp), before);
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("refresh refuses invalid session locks promptly without consuming special files or changing guides", (context) => {
  const env = fixture();
  try {
    create(env);
    rmSync(path.join(env.workspace, "CLAUDE.md"));
    const lock = path.join(env.workspace, "control/session.lock");
    mkdirSync(path.dirname(lock));
    for (const kind of ["fifo", "oversized", "malformed"]) {
      if (kind === "fifo") {
        if (process.platform === "win32") {
          context.diagnostic("FIFO case is unavailable on Windows; regular-file lock refusals still run.");
          continue;
        }
        const created = spawnSync("mkfifo", [lock], { encoding: "utf8", timeout: 5_000 });
        assert.equal(created.status, 0, created.stderr);
      } else writeFileSync(lock, kind === "oversized" ? "x".repeat(65 * 1024) : "{malformed-json\n");
      const before = snapshot(env.temp);
      const result = json(env, ["refresh-entrypoints", "--workspace", "app", "--apply"], 1, 10_000);
      assert.equal(result.ok, false);
      assert.equal(result.error, kind === "malformed" ? "entrypoints.refresh_failed" : "entrypoints.unsafe_lock");
      assertBoundedReport(env, result);
      assert.deepEqual(snapshot(env.temp), before, `${kind} lock and all guides must remain unchanged`);
      rmSync(lock);
    }
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});

test("verified stale-lock recovery is explicit, preserves a live lock, and refreshes only guidance", () => {
  const env = fixture();
  try {
    create(env);
    rmSync(path.join(env.workspace, "CLAUDE.md"));
    const lock = path.join(env.workspace, "control/session.lock");
    assert.equal(acquireLock(lock, { ownerSessionId: "live-session", ttlSeconds: 300, retries: 0 }).ok, true);
    const live = snapshot(env.temp);
    const args = ["refresh-entrypoints", "--workspace", "app"];
    const invalid = json(env, [...args, "--break-stale-verified"], 1, 10_000);
    assert.equal(invalid.error, "entrypoints.recovery_requires_apply");
    const liveRefusal = json(env, [...args, "--apply", "--break-stale-verified"], 1, 10_000);
    assert.equal(liveRefusal.error, "entrypoints.session_lock_unavailable");
    assert.deepEqual(snapshot(env.temp), live, "explicit stale recovery must never break a live lock");
    releaseLock(lock, "live-session");

    assert.equal(
      acquireLock(lock, {
        ownerSessionId: "interrupted-session",
        ttlSeconds: 1,
        retries: 0,
        now: () => "2000-01-01T00:00:00.000Z",
      }).ok,
      true,
    );
    const stale = snapshot(env.temp);
    const refusal = json(env, [...args, "--apply"], 1, 10_000);
    assert.equal(refusal.error, "entrypoints.session_lock_stale");
    assertBoundedReport(env, refusal);
    assert.deepEqual(snapshot(env.temp), stale, "default refresh must retain the unverified stale lock");

    const recovered = json(env, [...args, "--apply", "--break-stale-verified"], 0, 10_000);
    assert.equal(recovered.status, "current");
    assert.equal(recovered.applied, true);
    assertBoundedReport(env, recovered);
    const after = snapshot(env.temp);
    const changed = [...new Set([...Object.keys(stale), ...Object.keys(after)])].filter((file) => stale[file] !== after[file]);
    assert.deepEqual(changed.sort(), ["workspace/CLAUDE.md", "workspace/control/session.lock"]);
    assert.equal(existsSync(lock), false);
    for (const relative of ["catalog.json", ".b2c-launch/runtime.json", "state", ".claude"])
      assert.equal(existsSync(path.join(env.workspace, relative)), false);
  } finally {
    rmSync(env.temp, { recursive: true, force: true });
  }
});
