import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assert, repoRoot, skillRoot, type Harness } from "./_harness.js";
import { buildAuditPlan, PRESUBMIT_CORE_IDS, stepSkippedByLane } from "../../../tooling/lib/audit-plan.js";

/**
 * Cadence regressions for issue #25: presubmit vs full selection, cancel vs protected
 * full, deferred vs failed aggregation, and the workflow expressions that implement them.
 */
export function register(harness: Harness): void {
  const laneScript = path.join(skillRoot, "tooling/ci-lane.mjs");
  const aggregateScript = path.join(skillRoot, "tooling/ci-aggregate.mjs");
  const ciYml = readFileSync(path.join(skillRoot, ".github/workflows/ci.yml"), "utf8");
  const publishYml = readFileSync(path.join(skillRoot, ".github/workflows/publish.yml"), "utf8");

  const runLane = (args: string[], env: NodeJS.ProcessEnv = {}) =>
    spawnSync(process.execPath, [laneScript, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, EVENT_NAME: "", VERIFICATION: "", GITHUB_OUTPUT: "", ...env },
    });

  const runAggregate = (env: NodeJS.ProcessEnv) =>
    spawnSync(process.execPath, [aggregateScript], { cwd: repoRoot, encoding: "utf8", env: { ...process.env, ...env } });

  const evalModule = (source: string): { status: number | null; stdout: string; stderr: string } => {
    const specifier = pathToFileUrl(laneScript);
    return spawnSync(process.execPath, ["--input-type=module", "-e", `import * as m from ${JSON.stringify(specifier)}; ${source}`], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  };

  harness.check("presubmit vs full: docs stay on presubmit; knowledge selects hosted; kernel defers heavy serial suites", () => {
    const docs = runLane(["--files", "docs/validators.md"]);
    assert(docs.status === 0, `docs lane failed: ${docs.stderr}`);
    assert(docs.stdout.includes("verification=presubmit"), `docs must be presubmit:\n${docs.stdout}`);
    assert(docs.stdout.includes("heavy=false"), `docs must not select serial suites:\n${docs.stdout}`);
    assert(docs.stdout.includes("hosted=false") && docs.stdout.includes("app=false"), `docs must not select hosted/app:\n${docs.stdout}`);

    const knowledge = runLane(["--files", "knowledge/store/aso-apple-keyword-evidence.md"]);
    assert(knowledge.status === 0 && knowledge.stdout.includes("verification=presubmit"), `knowledge must stay presubmit:\n${knowledge.stdout}`);
    assert(knowledge.stdout.includes("hosted=true"), `knowledge feeds the hosted bundle:\n${knowledge.stdout}`);
    assert(knowledge.stdout.includes("heavy=false"), `knowledge must not auto-run serial suites:\n${knowledge.stdout}`);

    const contracts = runLane(["--files", "contracts/public-api/service.ts"]);
    assert(
      contracts.status === 0 && contracts.stdout.includes("scopes=") && contracts.stdout.includes("public-api"),
      `contracts select public-api extras:\n${contracts.stdout}`,
    );

    const kernel = runLane(["--files", "kernel/session/run.ts"]);
    assert(kernel.status === 0 && kernel.stdout.includes("heavy=true"), `kernel is in full-suite scope:\n${kernel.stdout}`);
    assert(kernel.stdout.includes("verification=presubmit"), `ordinary kernel PRs still presubmit:\n${kernel.stdout}`);
    assert(kernel.stdout.includes("scopes=boundaries"), `kernel selects boundaries extras:\n${kernel.stdout}`);
    assert(kernel.stdout.includes("hosted=false"), `kernel/session is not a hosted bundle input:\n${kernel.stdout}`);

    const full = runLane(["--verification", "full", "--files", "docs/validators.md"]);
    assert(full.status === 0 && full.stdout.includes("verification=full"), `explicit full must not stay presubmit:\n${full.stdout}`);
    assert(
      full.stdout.includes("hosted=true") && full.stdout.includes("app=true") && full.stdout.includes("heavy=true"),
      `full expands every job:\n${full.stdout}`,
    );
  });

  harness.check("presubmit vs full: workflow_dispatch defaults to full; an unknown diff expands extras", () => {
    const dispatch = runLane([], { EVENT_NAME: "workflow_dispatch", BASE_SHA: "", HEAD_SHA: "" });
    assert(dispatch.status === 0 && dispatch.stdout.includes("verification=full"), `dispatch default is full:\n${dispatch.stdout}`);

    const missing = runLane([], { EVENT_NAME: "pull_request", BASE_SHA: "", HEAD_SHA: "" });
    assert(missing.status === 0 && missing.stdout.includes("expand=true"), `missing SHAs expand coverage:\n${missing.stdout}`);
    assert(missing.stdout.includes("hosted=true") && missing.stdout.includes("app=true"), `unknown scope expands hosted/app:\n${missing.stdout}`);
    assert(missing.stdout.includes("verification=presubmit"), `a PR with unknown scope still does not claim full:\n${missing.stdout}`);
  });

  harness.check("cancel vs protected full: ordinary PR and main cancel; explicit full does not", () => {
    const result = evalModule(`
      const ordinaryPr = m.cancelInProgress({ eventName: "pull_request", verification: "presubmit" });
      const ordinaryMain = m.cancelInProgress({ eventName: "push", verification: "presubmit" });
      const protectedFull = m.cancelInProgress({ eventName: "workflow_dispatch", verification: "full" });
      const dispatchPresubmit = m.cancelInProgress({ eventName: "workflow_dispatch", verification: "presubmit" });
      const prGroup = m.concurrencyGroup({ workflow: "CI", eventName: "pull_request", prNumber: 25, ref: "refs/pull/25/merge", verification: "presubmit" });
      const mainGroup = m.concurrencyGroup({ workflow: "CI", eventName: "push", ref: "refs/heads/main", verification: "presubmit" });
      const fullGroup = m.concurrencyGroup({ workflow: "CI", eventName: "workflow_dispatch", ref: "refs/heads/main", verification: "full" });
      if (!ordinaryPr || !ordinaryMain || protectedFull || !dispatchPresubmit) throw new Error("cancel flags");
      if (!prGroup.endsWith("-ordinary") || !mainGroup.endsWith("-ordinary") || !fullGroup.endsWith("-full")) throw new Error("groups");
      if (mainGroup === fullGroup) throw new Error("full must not share the ordinary main group");
      console.log("ok");
    `);
    assert(result.status === 0 && result.stdout.includes("ok"), `concurrency helper failed:\n${result.stdout}\n${result.stderr}`);
    assert(ciYml.includes(evalModule(`console.log(m.CI_CONCURRENCY_GROUP_EXPR)`).stdout.trim()), "ci.yml must use the ordinary-vs-full concurrency group");
    assert(ciYml.includes(evalModule(`console.log(m.CI_CANCEL_IN_PROGRESS_EXPR)`).stdout.trim()), "ci.yml must protect full dispatch from cancel-in-progress");
    assert(/cancel-in-progress:\s*false/.test(publishYml), "publish.yml must keep cancel-in-progress: false");
    assert(/group:\s*publish-/.test(publishYml), "publish.yml must keep its own concurrency group");
    assert(!ciYml.includes("[skip ci]") && !ciYml.includes("continue-on-error"), "ci.yml must not skip or swallow failures");
  });

  harness.check("deferred vs failed: a presubmit pass is not a full-audit pass; cancelled and missing fail", () => {
    const presubmitPass = runAggregate({
      JOB_PRESUBMIT: "success",
      JOB_AUDIT_FAST: "skipped",
      JOB_AUDIT_HEAVY: "skipped",
      JOB_HOSTED: "skipped",
      JOB_APP: "skipped",
      VERIFICATION: "presubmit",
      HOSTED: "false",
      APP: "false",
      SCOPE_RESULT: "success",
    });
    assert(presubmitPass.status === 0, `presubmit with deferred jobs must pass:\n${presubmitPass.stderr}\n${presubmitPass.stdout}`);
    assert(presubmitPass.stdout.includes("This is not a full-audit pass"), `must not claim a full audit:\n${presubmitPass.stdout}`);
    assert(presubmitPass.stdout.includes("audit-heavy"), `must name deferred heavy:\n${presubmitPass.stdout}`);

    const cancelled = runAggregate({
      JOB_PRESUBMIT: "cancelled",
      JOB_AUDIT_FAST: "skipped",
      JOB_AUDIT_HEAVY: "skipped",
      JOB_HOSTED: "skipped",
      JOB_APP: "skipped",
      VERIFICATION: "presubmit",
      HOSTED: "false",
      APP: "false",
      SCOPE_RESULT: "success",
    });
    assert(cancelled.status === 1, `cancelled presubmit must fail:\n${cancelled.stdout}`);
    assert(
      cancelled.stderr.includes("Cancelled") || cancelled.stdout.includes("cancelled"),
      `must distinguish cancelled:\n${cancelled.stdout}\n${cancelled.stderr}`,
    );

    const missing = runAggregate({
      JOB_PRESUBMIT: "skipped",
      JOB_AUDIT_FAST: "skipped",
      JOB_AUDIT_HEAVY: "skipped",
      JOB_HOSTED: "skipped",
      JOB_APP: "skipped",
      VERIFICATION: "presubmit",
      HOSTED: "false",
      APP: "false",
      SCOPE_RESULT: "success",
    });
    assert(missing.status === 1, `skipped required presubmit must fail:\n${missing.stdout}`);

    const failedHeavy = runAggregate({
      JOB_PRESUBMIT: "skipped",
      JOB_AUDIT_FAST: "success",
      JOB_AUDIT_HEAVY: "failure",
      JOB_HOSTED: "success",
      JOB_APP: "success",
      VERIFICATION: "full",
      HOSTED: "true",
      APP: "true",
      SCOPE_RESULT: "success",
    });
    assert(failedHeavy.status === 1, `failed heavy must fail full:\n${failedHeavy.stdout}`);

    const fullPass = runAggregate({
      JOB_PRESUBMIT: "skipped",
      JOB_AUDIT_FAST: "success",
      JOB_AUDIT_HEAVY: "success",
      JOB_HOSTED: "success",
      JOB_APP: "success",
      VERIFICATION: "full",
      HOSTED: "true",
      APP: "true",
      SCOPE_RESULT: "success",
    });
    assert(fullPass.status === 0 && fullPass.stdout.includes("Full verification passed"), `full success:\n${fullPass.stdout}`);
  });

  harness.check("suite inventory: every audit-plan step still belongs to full verification", () => {
    const plan = buildAuditPlan("repo");
    const serialIds = ["test:validators", "test:fixtures", "test:boundaries", "test:parity", "check:engine-e2e"];
    for (const id of serialIds) {
      const step = plan.find((candidate) => candidate.id === id);
      assert(step !== undefined, `${id} must remain in the audit plan`);
      assert(step.serial === true, `${id} must remain serial`);
      assert(!PRESUBMIT_CORE_IDS.has(id) || id === "test:boundaries", `${id} must not join the measured presubmit core`);
    }
    for (const step of plan) {
      const all = stepSkippedByLane(step, "all") === undefined;
      const fast = stepSkippedByLane(step, "fast") === undefined;
      const heavy = stepSkippedByLane(step, "heavy") === undefined;
      const presubmit = stepSkippedByLane(step, "presubmit", ["boundaries", "security", "public-api"]) === undefined;
      assert(all, `${step.id} vanished from lane all`);
      assert(presubmit || fast || heavy, `${step.id} is not selected by presubmit, fast, or heavy`);
    }
    assert(ciYml.includes("npm run hosted:check") && ciYml.includes("npm run app:check"), "hosted and app jobs must remain");
    assert(ciYml.includes("npm run audit:ci -- --lane fast"), "full verification must still run the fast pool");
    assert(ciYml.includes("--lane heavy --shard"), "full verification must still run heavy shards");
  });

  for (const scenario of [
    "success",
    "missing",
    "failed",
    "cancelled",
    "timed_out",
    "wrong_head",
    "missing_aggregate",
    "replaced",
    "armed",
    "advanced",
    "stale_merge",
    "missing_merge",
  ]) {
    harness.check(`stamp merge waits for its candidate and handles ${scenario}`, () => {
      const script = pathToFileUrl(path.join(skillRoot, "tooling/merge-stamp.mjs"));
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `
        import { mergeStamp } from ${JSON.stringify(script)};
        const scenario = ${JSON.stringify(scenario)};
        const calls = [];
        let lists = 0, reads = 0, merged = false, error = false, answer;
        const run = (bin, args) => {
          const command = [bin, ...args].join(" "); calls.push(command);
          const ok = (value = "") => ({ status: 0, stdout: typeof value === "string" ? value : JSON.stringify(value), stderr: "" });
          if (command === "git rev-parse HEAD") return ok("candidate");
          if (command.startsWith("gh pr view")) {
            reads++;
            return ok({state: merged ? "MERGED" : "OPEN", headRefOid: scenario === "replaced" && reads > 1 ? "replacement" : "candidate", autoMergeRequest: scenario === "armed" ? {} : null, mergeCommit: merged ? {oid:"merged"} : null});
          }
          if (command.startsWith("gh run list")) {
            lists++;
            const prior = [{databaseId:1,headSha:"candidate"}, {databaseId:2,headSha:"unrelated"}];
            return ok(lists < 3 || scenario === "missing" ? prior : [...prior,{databaseId:3,headSha:"candidate"}]);
          }
          if (command.startsWith("gh run watch")) return scenario === "failed" ? {status:1,stdout:"",stderr:"CI failed"} : ok();
          if (command.startsWith("gh run view")) return ok({status:"completed", conclusion:["cancelled","timed_out"].includes(scenario) ? scenario : "success", headSha:scenario === "wrong_head" ? "other" : "candidate", jobs:scenario === "missing_aggregate" ? [] : [{name:"CI complete",conclusion:"success"}]});
          if (command.startsWith("git merge-base")) return {status:scenario === "advanced" || (scenario === "missing_merge" && args[2] === "merged") ? 1 : 0,stdout:"",stderr:""};
          if (command.startsWith("gh pr merge")) { merged = true; return ok(); }
          if (command === "npm run check:stamped-tree") return {status:scenario === "stale_merge" ? 1 : 0,stdout:"",stderr:""};
          if (command.startsWith("gh workflow run") || command.startsWith("git fetch") || command.startsWith("git checkout")) return ok();
          throw new Error("Unexpected command: " + command);
        };
        try { answer = await mergeStamp("12", "release/stamp-1.2.3", {run,sleep:async()=>{}}); } catch { error = true; }
        const shouldMerge = ["success","stale_merge","missing_merge"].includes(scenario);
        if (merged !== shouldMerge) throw new Error("Unexpected merge: " + JSON.stringify(calls));
        if (error !== !["success","advanced"].includes(scenario)) throw new Error("Unexpected result");
        const refreshed = calls.includes("gh workflow run stamp.yml --ref main");
        if (refreshed !== ["advanced","stale_merge"].includes(scenario)) throw new Error("Missing or unnecessary recovery");
        if (scenario === "success") {
          if (answer.ci !== 3 || !answer.merged) throw new Error("Wrong dispatched run");
          const wait = calls.indexOf("gh run watch 3 --exit-status --interval 10");
          const merge = calls.indexOf("gh pr merge 12 --squash --match-head-commit candidate");
          if (wait < 0 || merge < wait || !calls.includes("npm run check:stamped-tree")) throw new Error("Merge order or post-merge guard");
        }
        console.log("ok");
      `,
        ],
        { cwd: repoRoot, encoding: "utf8" },
      );
      assert(result.status === 0, `stamp scenario failed:\n${result.stdout}\n${result.stderr}`);
    });
  }

  harness.check("stamp workflow disarms inherited auto-merge before updating a candidate", () => {
    const stamp = readFileSync(path.join(skillRoot, ".github/workflows/stamp.yml"), "utf8");
    const disarm = stamp.indexOf('gh pr merge "$number" --disable-auto');
    const update = stamp.indexOf('npm run release:stamp -- --push --branch "$branch"');
    assert(disarm >= 0 && update > disarm, "disarm before updating the branch");
    assert(stamp.includes('node tooling/merge-stamp.mjs "$number" "$head"'), "workflow must invoke the tested merge path");
    assert(!stamp.includes("--auto --squash"), "do not arm immediate auto-merge");
  });
}

function pathToFileUrl(filePath: string): string {
  return pathToFileURL(path.resolve(filePath)).href;
}
