import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { CatalogInput } from "../../../kernel/engine/compile.js";
import { laneKeys, type RunStateDocument } from "../../../kernel/schema/types.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

/**
 * Behavioral integration proof through the existing session, subprocess executor,
 * reducer, independent review and repair owners. Workers are deterministic local
 * processes: this is not model-quality, live-provider, device or customer evidence.
 */
const dataRoot = path.join(skillRoot, "checks/verification/test/data/repair-loop");
const sourcePath = "app/progress.cjs";
const modes = ["repair-after-review", "unchanged", "bogus", "missing-reviewer", "missing-authority", "worker-failure"] as const;
type Mode = (typeof modes)[number];
interface ProcessEvent {
  kind: "worker" | "reviewer";
  workflowId: string;
  pid: number;
  repairInstructionsReceived: boolean;
  sourceSha256: string;
  accepted?: boolean;
  assertions?: number;
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function digest(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function runScript(script: string, args: string[], env: NodeJS.ProcessEnv, timeout = 60_000) {
  // The tsx loader needs no CLI IPC socket. Nested session reducers retain their
  // supported launcher: compiled dist when built, ordinary tsx otherwise.
  return spawnSync(process.execPath, ["--import", "tsx", path.join(skillRoot, script), ...args], {
    cwd: skillRoot,
    env,
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
  });
}

function bootstrap(h: Harness, mode: Mode) {
  const root = h.makeTempDir(`consumer-repair-${mode}`);
  const workspace = path.join(root, "workspace");
  mkdirSync(workspace);
  // No provider credentials, notification keys or inherited worker allowlist.
  const env = Object.fromEntries(
    ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL", "CI"].flatMap((key) =>
      process.env[key] === undefined ? [] : [[key, process.env[key]!]],
    ),
  );
  env.B2C_APP_BUILDER_HOME = path.join(root, "registry");
  const now = new Date().toISOString();
  let patchNumber = 0;
  const commit = (targetDoc: string, file: string, values: Record<string, unknown>): void => {
    const patchId = `repair-probe-${++patchNumber}`;
    const patchPath = path.join(root, `${patchId}.json`);
    writeJson(patchPath, {
      schemaVersion: "1.0.0",
      patchId,
      targetDoc,
      reason: "Isolated local consumer repair fixture setup",
      authoredBy: "repair-fixture",
      authoredAt: now,
      preconditions: [],
      ops: Object.entries(values).map(([key, value]) => ({ op: "set", path: [key], value })),
      declaredOutputs: Object.keys(values).map((key) => [key]),
    });
    const result = runScript(
      "kernel/reducer/cli.ts",
      [
        "commit",
        "--patch",
        patchPath,
        "--file",
        path.join(workspace, file),
        "--manifest",
        path.join(workspace, "control/manifest.json"),
        "--audit",
        path.join(workspace, "control/audit.jsonl"),
        "--session",
        "repair-fixture-setup",
        "--founder-authority",
        "true",
      ],
      env,
    );
    assert(result.status === 0, `reducer setup failed: ${result.error?.message ?? ""}\n${result.stdout}\n${result.stderr}`);
  };
  commit("business-state", "state/business-state.json", {
    narrative: { sinceLastTime: "", rightNow: "", yourCall: "", lastCelebratedPhase: "" },
    project: {
      name: "Daily Plan",
      slug: mode,
      owner: "Local fixture",
      phase: "phase_0_orient",
      launchScope: "essentials",
      kickoffDate: "",
      platforms: ["ios"],
      bundleIds: { ios: "com.example.dailyplan", android: "" },
      publicUrls: { landing: "", privacy: "", terms: "" },
    },
    lanes: Object.fromEntries(laneKeys.map((key) => [key, { status: "pending", evidence: [], blockers: [] }])),
    founderGates: { pending: [] },
  });
  const grant = (domainId: string) => ({ domainId, level: "run-with-guardrails", prerequisites: [], grantedAt: now, grantedBy: "founder", updatedAt: now });
  commit("control", "control/control.json", {
    businessSlug: mode,
    killSwitch: { engaged: false, engagedAt: "", engagedBy: "", reason: "" },
    waivers: [],
    grants: { "domain.research": grant("domain.research"), ...(mode === "missing-authority" ? {} : { "domain.engineering": grant("domain.engineering") }) },
  });
  commit("budget-ledger", "control/budget-ledger.json", { balances: [], entries: [] });
  mkdirSync(path.join(workspace, "app"));
  copyFileSync(path.join(dataRoot, "progress-broken.cjs"), path.join(workspace, sourcePath));
  writeFileSync(
    path.join(workspace, "progress-criteria.md"),
    "Daily plan completion is the rounded percentage of done over total, clamped to 0..100. Return 0 for non-positive or non-finite total and non-finite done. Record original source identity and actual failing cases before repair.\n",
  );
  const common = {
    actionClass: "draft" as const,
    reads: ["progress-criteria.md"],
    providerIds: [],
    laneIds: [],
    founderOnlyActions: [],
    gateCommands: [],
    idempotent: true,
    maxAttempts: 3,
  };
  const catalog: CatalogInput = {
    version: "catalog.local-consumer-repair.v1",
    artifacts: [
      { id: "artifact.observation", path: "evidence/observation.json" },
      { id: "artifact.progress", path: sourcePath },
    ],
    workflows: [
      {
        ...common,
        id: "workflow.observe-progress",
        title: "Observe daily plan progress",
        domainId: "domain.research",
        sourceAccess: [{ path: sourcePath, access: "read" }],
        dependencies: [],
        outputPaths: ["evidence/observation.json"],
        instructions: "Execute current app progress source and record its identity and behavioral failures.",
      },
      {
        ...common,
        id: "workflow.repair-progress",
        title: "Repair daily plan progress",
        domainId: "domain.engineering",
        sourceAccess: [{ path: sourcePath, access: "update" }],
        dependencies: ["workflow.observe-progress"],
        reads: ["progress-criteria.md", "evidence/observation.json"],
        outputPaths: [sourcePath],
        instructions:
          "Repair completionPercent to satisfy the accepted progress criteria. A separate reviewer executes current source; repair only the assigned task.",
      },
    ],
  };
  writeJson(path.join(workspace, "catalog.json"), catalog);
  writeJson(path.join(workspace, "brief.json"), { schemaVersion: "1.0.0", businessSlug: mode, workerRuntime: "codex" });
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  const command = path.join(bin, "codex");
  copyFileSync(path.join(dataRoot, "worker.cjs"), command);
  chmodSync(command, 0o755);
  const eventsPath = path.join(root, "events.jsonl");
  writeJson(path.join(root, "scenario.json"), {
    mode,
    eventsPath,
    checkerPath: path.join(dataRoot, "check-progress.cjs"),
    fixedSourcePath: path.join(dataRoot, "progress-fixed.cjs"),
    originalSha256: digest(path.join(workspace, sourcePath)),
  });
  env.PATH = `${bin}${path.delimiter}${env.PATH ?? ""}`;
  return { root, workspace, eventsPath, env };
}

export function register(h: Harness): void {
  for (const mode of modes) {
    h.check(`consumer repair loop: ${mode} preserves behavioral acceptance and bounded work`, () => {
      const { root, workspace, eventsPath, env } = bootstrap(h, mode);
      const sessionId = `consumer-repair-${mode}`;
      const started = performance.now();
      const result = runScript(
        "kernel/session/run.ts",
        [
          "--workspace",
          workspace,
          "--brief",
          path.join(workspace, "brief.json"),
          "--session",
          sessionId,
          "--executor",
          "auto",
          "--worker-runtime",
          "codex",
          "--verifier",
          "cli",
          "--max-concurrency",
          "1",
          "--wall-clock-seconds",
          "30",
        ],
        env,
        45_000,
      );
      const elapsedMs = Math.round(performance.now() - started);
      assert(result.status === 0, `session failed: ${result.error?.message ?? ""}\n${result.stdout}\n${result.stderr}`);
      const run = JSON.parse(readFileSync(path.join(workspace, "run/run-state.json"), "utf8")) as RunStateDocument;
      const node = run.nodes["run.repair-progress"]!;
      const binding = run.artifactBindings.find((entry) => entry.artifactId === "artifact.progress")!;
      const events = existsSync(eventsPath)
        ? readFileSync(eventsPath, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as ProcessEvent)
        : [];
      const producers = events.filter((event) => event.workflowId === "workflow.repair-progress" && event.kind === "worker");
      const reviewers = events.filter((event) => event.workflowId === "workflow.repair-progress" && event.kind === "reviewer");
      const check = spawnSync(process.execPath, [path.join(dataRoot, "check-progress.cjs"), path.join(workspace, sourcePath)], {
        env,
        encoding: "utf8",
        timeout: 5000,
      });
      const acceptedRepair = node.status === "succeeded" && binding.accepted && binding.producedBy === node.nodeId;
      writeJson(path.join(root, "measurement.json"), {
        mode,
        elapsedMs,
        producerProcesses: producers.length,
        reviewerProcesses: reviewers.length,
        status: node.status,
        acceptedRepair,
        behaviorPassed: check.status === 0,
        scope: "Deterministic local processes; no model requests or live-provider cost measurement.",
      });
      assert(run.nodes["run.observe-progress"]?.status === "succeeded", "the source observation must precede engineering dispatch");
      assert(existsSync(path.join(workspace, "digests", `${sessionId}.md`)), "every session must leave its outcome digest");
      assert(node.attempts.length <= 3, "the mandate must enforce its three-attempt repair bound");
      assert(
        producers.every((producer) => reviewers.every((reviewer) => producer.pid !== reviewer.pid)),
        "producer and verifier must run in separate processes",
      );

      if (mode === "repair-after-review") {
        assert(acceptedRepair && check.status === 0, "acceptance requires a produced source artifact and independently passing behavior");
        assert(
          producers.length === 2 && reviewers.length === 2 && node.attempts.length === 2,
          "a rejected first candidate must cause one repair and one recheck",
        );
        assert(producers[1]?.repairInstructionsReceived, "the session must deliver independent rejection findings to its repair worker");
        assert(producers[0]?.sourceSha256 !== producers[1]?.sourceSha256, "repair must change source bytes, not only a report");
        assert(
          node.attempts[0]?.independentVerification?.verdict === "rejected" && node.attempts[1]?.independentVerification?.verdict === "accepted",
          "retain both candidate judgments",
        );
        assert(binding.attemptId === node.attempts[1]?.id, "accepted source must identify its actual producing attempt");
        assert(node.verifiedBySessionId === `${sessionId}.verifier`, "acceptance must retain independent reviewer provenance");
        assert(
          node.attempts[1]?.independentVerification?.evidence.some((line) => line.includes("runtime=unknown")),
          "local source checks must not claim observed UI or device proof",
        );
      } else {
        assert(!acceptedRepair && !node.acceptedOutputFingerprint, "a control must not create accepted repair output");
        if (mode === "missing-authority") {
          assert(producers.length === 0 && reviewers.length === 0 && node.attempts.length === 0, "missing engineering authority must prevent dispatch");
          assert(node.blocker?.includes("No autonomy grant"), "preserve the missing-authority reason");
          assert(digest(path.join(workspace, sourcePath)) === digest(path.join(dataRoot, "progress-broken.cjs")), "refused work must preserve original source");
        } else if (mode === "missing-reviewer") {
          assert(check.status === 0 && !binding.accepted, "passing source alone cannot replace independent acceptance");
          assert(
            producers.length === 1 && reviewers.length === 1 && node.blocker === "Verification required",
            "an unavailable reviewer must leave a bounded pending judgment",
          );
          assert(!node.attempts[0]?.independentVerification, "unavailability is neither acceptance nor rejection");
        } else if (mode === "worker-failure") {
          assert(producers.length === 3 && reviewers.length === 0 && !binding.accepted, "failed producers must exhaust their bound without reaching review");
          assert(node.blocker?.includes("Worker repair attempts exhausted"), "retain bounded worker failure");
        } else {
          assert(
            check.status === 1 && producers.length === 3 && reviewers.length === 3 && !binding.accepted,
            "unchanged or bogus source must fail independently on every bounded attempt",
          );
          assert(
            node.attempts.every((attempt) => attempt.independentVerification?.verdict === "rejected"),
            "every rejected candidate must remain visible",
          );
          assert(node.blocker?.includes("repair attempts exhausted"), "repeated rejected work must stop at the repair bound");
        }
      }
    });
  }
}
