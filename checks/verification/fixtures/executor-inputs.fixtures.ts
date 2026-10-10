import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import { snapshotTaskInputs, verifyTaskInputs } from "../../../kernel/session/input-inventory.js";
import { workerExecutionDeadline } from "../../../kernel/session/executor.js";

export function register(harness: Harness): void {
  registerProcessSettlement(harness);
  harness.check("executor deadlines: task bounds and remaining session time are independent of heartbeat leases", () => {
    const now = 1000;
    assert(workerExecutionDeadline({}, {}, now) === now + 1800000, "standalone work must retain a bounded thirty-minute default");
    assert(workerExecutionDeadline({ executionTimeoutSeconds: 5 }, {}, now) === 6000, "explicit task execution limits must be preserved");
    assert(workerExecutionDeadline({ executionTimeoutSeconds: 5 }, { executionDeadlineAt: 3000 }, now) === 3000, "session deadline must cap a task");
    assert(workerExecutionDeadline({}, { executionDeadlineAt: 900 }, now) === 900, "an expired session must never receive fresh time");
    assert(workerExecutionDeadline({}, { executionDeadlineAt: Number.NaN }, now) === now, "an invalid deadline must fail closed");
  });
  harness.check("executor inputs: audit directories expand to stable file-byte receipts", () => {
    const root = harness.makeTempDir("audit-inputs");
    mkdirSync(path.join(root, "design/reference-packs/nested"), { recursive: true });
    writeFileSync(path.join(root, "design/reference-packs/z.md"), "abc");
    writeFileSync(path.join(root, "design/reference-packs/nested/a.md"), "reference");
    const snapshot = snapshotTaskInputs(root, ["design/reference-packs/", "design/reference-packs/z.md"]);
    assert(
      snapshot.files.map((file) => file.path).join(",") === "design/reference-packs/nested/a.md,design/reference-packs/z.md",
      "inventory must be sorted and deduplicated",
    );
    assert(
      snapshot.files[1]?.sha256 === "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      "receipt must hash bytes, not directory metadata",
    );
    assert(verifyTaskInputs(root, snapshot).length === 0, "unchanged inputs should pass");
    writeFileSync(path.join(root, "design/reference-packs/z.md"), "changed");
    assert(
      verifyTaskInputs(root, snapshot).some((error) => error.includes("changed")),
      "changed reference must invalidate dispatch evidence",
    );
  });

  harness.check("executor inputs: added directory content invalidates the original inventory", () => {
    const root = harness.makeTempDir("audit-input-added");
    mkdirSync(path.join(root, "rubrics"));
    writeFileSync(path.join(root, "rubrics/base.md"), "rubric");
    const snapshot = snapshotTaskInputs(root, ["rubrics/"]);
    writeFileSync(path.join(root, "rubrics/new.md"), "new criteria");
    assert(
      verifyTaskInputs(root, snapshot).some((error) => error.includes("inventory")),
      "new criteria cannot escape stale detection",
    );
  });

  harness.check("executor inputs: paths and nested symlinks fail before content is read", () => {
    const root = harness.makeTempDir("audit-input-links");
    const outside = harness.makeTempDir("audit-input-outside");
    writeFileSync(path.join(outside, "source.md"), "outside data");
    symlinkSync(outside, path.join(root, "linked"));
    for (const target of ["../audit-input-outside/source.md", "linked/source.md", outside]) {
      let failed = false;
      try {
        snapshotTaskInputs(root, [target]);
      } catch {
        failed = true;
      }
      assert(failed, `unsafe task path must fail: ${target}`);
    }
  });

  harness.check("executor inputs: empty or oversized inventories cannot silently omit required inputs", () => {
    const root = harness.makeTempDir("audit-input-bounds");
    mkdirSync(path.join(root, "empty"));
    writeFileSync(path.join(root, "large.md"), "123456");
    for (const [targets, limits] of [
      [["empty/"], {}],
      [["large.md"], { maxBytes: 5 }],
    ] as const) {
      let failed = false;
      try {
        snapshotTaskInputs(root, targets, limits);
      } catch {
        failed = true;
      }
      assert(failed, "a bound or empty required directory must fail visibly");
    }
  });

  harness.check("executor inputs: only explicitly produced files may change", () => {
    const root = harness.makeTempDir("audit-input-mutable");
    writeFileSync(path.join(root, "draft.md"), "before");
    writeFileSync(path.join(root, "rubric.md"), "fixed");
    const snapshot = snapshotTaskInputs(root, ["draft.md", "rubric.md"]);
    writeFileSync(path.join(root, "draft.md"), "after");
    assert(verifyTaskInputs(root, snapshot, ["draft.md"]).length === 0, "declared output may change");
    writeFileSync(path.join(root, "rubric.md"), "weaker");
    assert(verifyTaskInputs(root, snapshot, ["draft.md"]).length === 1, "producer cannot rewrite rubric to pass");
  });

  const workspace = harness.makeTempDir("executor-directory-integration");
  const bin = path.join(workspace, "bin");
  mkdirSync(bin);
  mkdirSync(path.join(workspace, "design/reference-packs"), { recursive: true });
  mkdirSync(path.join(workspace, "design/reviews/rubrics"), { recursive: true });
  writeFileSync(path.join(workspace, "design/reference-packs/app.md"), "Observed native reference");
  writeFileSync(path.join(workspace, "design/reviews/rubrics/visual.md"), "Frozen criteria");
  writeFileSync(path.join(workspace, "method.md"), "Compare current captures against frozen criteria.");
  const fakeCli = path.join(bin, "codex");
  writeFileSync(
    fakeCli,
    `#!/usr/bin/env node
const fs = require('node:fs');
const crypto = require('node:crypto');
if (process.argv.includes('--version')) { console.log('fixture-runtime'); process.exit(0); }
const prompt = process.argv.at(-1);
const begin = 'BEGIN_KNOWLEDGE_RECEIPT';
const end = 'END_KNOWLEDGE_RECEIPT';
const receipt = JSON.parse(prompt.slice(prompt.lastIndexOf(begin) + begin.length, prompt.lastIndexOf(end)).trim());
const receiptRepair = prompt.includes('RECEIPT-ONLY REPAIR');
if (!receiptRepair && fs.existsSync(${JSON.stringify(path.join(workspace, "invalid-receipt"))})) {
  console.log('worker completed the task, but its receipt transport was invalid');
  process.exit(0);
}
for (const item of receipt.outputEvidence) {
  fs.writeFileSync(item.outputPath, 'Independent findings for the current candidate.');
  if (receiptRepair) fs.appendFileSync(item.outputPath, '\\nreceipt repair mutation');
  item.knowledgePaths = receipt.mandatoryKnowledge.map(entry => entry.path);
  item.summary = 'Inspected all frozen reference and rubric files and wrote findings.';
}
for (const item of [...receipt.contractFiles, ...receipt.taskArtifacts, ...receipt.mandatoryKnowledge]) {
  item.sha256 = 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
}
if (fs.existsSync('mutate-reference')) fs.writeFileSync('design/reference-packs/new.md', 'Unreviewed new reference');
console.log(begin + '\\n' + JSON.stringify(receipt) + '\\n' + end);
`,
  );
  chmodSync(fakeCli, 0o755);
  const integration = path.join(workspace, "integration.ts");
  writeFileSync(
    integration,
    `
import { createCliExecutor } from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import { writeFileSync } from 'node:fs';
process.env.PATH = ${JSON.stringify(bin)} + ':' + process.env.PATH;
const node = { id: 'audit', workflowId: 'workflow.design.audit', title: 'Review design', reads: ['design/reference-packs/', 'design/reviews/rubrics/'], references: [{path: 'method.md', title: 'Review method', loadWhen: 'before review'}], outputs: ['findings'], approvals: [], tokenBudget: 12000, ttlSeconds: 10, verification: { kind: 'deterministic', gateIds: [], failClosed: true } } as any;
const context = { runId: 'run', attemptId: 'attempt', workspaceDir: ${JSON.stringify(workspace)}, skillRootDir: ${JSON.stringify(workspace)}, artifactPaths: { findings: 'findings.md' }, now: '2026-09-04T16:00:00Z', heartbeat() {} };
(async () => {
  const executor = createCliExecutor('codex');
  const first = await executor.execute(node, context);
  if (first.status !== 'succeeded') throw new Error(JSON.stringify(first));
  writeFileSync(${JSON.stringify(path.join(workspace, "mutate-reference"))}, 'yes');
  const changed = await executor.execute(node, context);
  if (changed.status !== 'failed' || !changed.error?.includes('inventory changed')) throw new Error('Changed input was accepted: ' + JSON.stringify(changed));
  writeFileSync(${JSON.stringify(path.join(workspace, "invalid-receipt"))}, 'yes');
  const receiptFailure = await executor.execute(node, context);
  if (
    receiptFailure.status !== 'failed' ||
    !receiptFailure.error?.startsWith('worker knowledge receipt rejected:') ||
    receiptFailure.outputs.length !== 1
  )
    throw new Error('Receipt repair did not preserve the candidate snapshot: ' + JSON.stringify(receiptFailure));
  console.log('directory dispatch and stale refusal proved');
})();
`,
  );
  harness.runScript(
    "executor inputs: real CLI receipt path accepts directories and refuses changed inventory",
    integration,
    [],
    0,
    "directory dispatch and stale refusal proved",
  );

  const repairWorkspace = harness.makeTempDir("executor-receipt-repair-budget");
  const repairBin = path.join(repairWorkspace, "bin");
  mkdirSync(repairBin);
  const repairCount = path.join(repairWorkspace, "invocations");
  const repairCli = path.join(repairBin, "codex");
  writeFileSync(
    repairCli,
    `#!/usr/bin/env node
const fs = require('node:fs');
const countPath = ${JSON.stringify(repairCount)};
if (process.argv.includes('--version')) { console.log('fixture-runtime'); process.exit(0); }
const count = Number(fs.existsSync(countPath) ? fs.readFileSync(countPath, 'utf8') : '0') + 1;
fs.writeFileSync(countPath, String(count));
const prompt = process.argv.at(-1);
const begin = 'BEGIN_KNOWLEDGE_RECEIPT';
const end = 'END_KNOWLEDGE_RECEIPT';
if (count === 1) fs.writeFileSync(${JSON.stringify(path.join(repairWorkspace, "result.md"))}, 'candidate output');
console.log(begin + '\\n{"taskArtifacts":[{"path":"not-declared.md","sha256":"sha256:bad"}]}\\n' + end);
`,
  );
  chmodSync(repairCli, 0o755);
  const repairIntegration = path.join(repairWorkspace, "integration.ts");
  writeFileSync(
    repairIntegration,
    `
import { createCliExecutor } from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import { readFileSync } from 'node:fs';
process.env.PATH = ${JSON.stringify(repairBin)} + ':' + process.env.PATH;
const node = { id: 'receipt-repair', workflowId: 'workflow.receipt-repair', title: 'Receipt repair', reads: [], references: [], outputs: ['result'], approvals: [], tokenBudget: 12000, ttlSeconds: 10, verification: { kind: 'deterministic', gateIds: [], failClosed: true } } as any;
const context = { runId: 'run', attemptId: 'attempt', workspaceDir: ${JSON.stringify(repairWorkspace)}, skillRootDir: ${JSON.stringify(repairWorkspace)}, artifactPaths: { result: 'result.md' }, now: '2026-09-12T16:00:00Z', heartbeat() {} };
(async () => {
  const result = await createCliExecutor('codex').execute(node, context);
  if (result.status !== 'failed' || !result.error?.includes('knowledge receipt rejected')) throw new Error('invalid receipt did not fail closed: ' + JSON.stringify(result));
  if (result.outputs.length !== 1 || result.outputs[0]?.path !== 'result.md') throw new Error('candidate output provenance was lost: ' + JSON.stringify(result));
  const invocations = readFileSync(${JSON.stringify(repairCount)}, 'utf8');
  if (invocations !== '2') throw new Error('receipt repair exceeded its one-continuation bound: ' + invocations);
  console.log('receipt repair bounded to one continuation with candidate preserved');
})();
`,
  );
  harness.runScript(
    "executor receipts: invalid repair stops after one continuation and preserves the candidate",
    repairIntegration,
    [],
    0,
    "receipt repair bounded to one continuation with candidate preserved",
  );

  const failureWorkspace = harness.makeTempDir("executor-failure-diagnostics");
  const failureBin = path.join(failureWorkspace, "bin");
  mkdirSync(failureBin);
  const failureCli = path.join(failureBin, "codex");
  writeFileSync(
    failureCli,
    `#!/usr/bin/env node
const fs = require('node:fs');
if (process.argv.includes('--version')) { console.log('fixture-runtime'); process.exit(0); }
const options = JSON.parse(fs.readFileSync('failure.json', 'utf8'));
fs.appendFileSync('invocations', 'worker\\n');
if (options.repair && !process.argv.at(-1).includes('RECEIPT-ONLY REPAIR')) {
  fs.writeFileSync('result.md', 'candidate retained');
  console.log('invalid receipt transport');
} else {
  process.stdout.write(options.stdout);
  process.stderr.write(options.stderr);
  process.exitCode = 1;
}
`,
  );
  chmodSync(failureCli, 0o755);
  symlinkSync(failureCli, path.join(failureBin, "claude"));
  symlinkSync(failureCli, path.join(failureBin, "cursor-agent"));
  const failureIntegration = path.join(failureWorkspace, "integration.ts");
  writeFileSync(
    failureIntegration,
    `
import assert from 'node:assert/strict';
import { createCliExecutor, createCliVerifier } from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import { readFileSync, writeFileSync } from 'node:fs';
process.env.PATH = ${JSON.stringify(failureBin)} + ':' + process.env.PATH;
process.chdir(${JSON.stringify(failureWorkspace)});
const node = {id:'failure',workflowId:'workflow.failure',title:'Failure fixture',reads:[],references:[],outputs:['result'],approvals:[],tokenBudget:12000,ttlSeconds:10,verification:{kind:'deterministic',gateIds:[],failClosed:true}} as any;
const context = {runId:'run',attemptId:'attempt',workspaceDir:process.cwd(),skillRootDir:process.cwd(),artifactPaths:{result:'result.md'},now:'2026-09-28T00:00:00Z',heartbeat(){}};
const reason = 'The selected model requires a newer version of the CLI.';
const noise = ('Unrelated MCP OAuth startup error.\\n').repeat(100);
const configure = (stdout, stderr=noise, repair=false) => {writeFileSync('failure.json',JSON.stringify({stdout,stderr,repair}));writeFileSync('invocations','');};
const events = [
  {type:'task_complete',error:JSON.stringify({type:'error',error:{message:reason}})},
  {type:'event_msg',payload:{type:'task_complete',error:{message:reason}}},
  {type:'turn.failed',error:{message:reason}},
  {type:'error',message:reason},
];
(async () => {
  for (const event of events) {
    configure(JSON.stringify(event)+'\\n');
    const failed = await createCliExecutor('auto').execute(node,context);
    assert.equal(failed.status,'failed');
    assert.equal(failed.error,'codex worker exited 1: '+reason);
    assert.equal(readFileSync('invocations','utf8'),'worker\\n','MCP auth noise must not replace the actual fatal cause or trigger an unrelated fallback');
  }
  const email = ['operator','example.invalid'].join('@');
  const secret = ['sk','test','1234567890abcdefghijkl'].join('_');
  configure(JSON.stringify({type:'turn.failed',error:{message:reason+' '+email+' '+secret+' /home/fixture/private '+('detail '.repeat(300))}}));
  const sanitized = await createCliExecutor('codex').execute(node,context);
  assert(sanitized.error.startsWith('codex worker exited 1: '+reason));
  assert(!sanitized.error.includes(email) && !sanitized.error.includes(secret) && !sanitized.error.includes('/home/fixture'));
  assert(sanitized.error.length <= 830,'diagnostic must remain bounded');
  for (const stdout of ['{broken',JSON.stringify({type:'item.completed',item:{type:'agent_message',text:reason}}),JSON.stringify({type:'error',message:'x'.repeat(70000)})]) {
    configure(stdout,'plain stderr fallback');
    const fallback = await createCliExecutor('codex').execute(node,context);
    assert.equal(fallback.error,'codex worker exited 1: plain stderr fallback','unrecognized, malformed, and oversized records must not become errors');
  }
  configure(JSON.stringify(events[0]),'other runtime stderr');
  const otherRuntime = await createCliExecutor('claude').execute(node,context);
  assert.equal(otherRuntime.error,'claude worker exited 1: other runtime stderr');
  configure(JSON.stringify(events[0]));
  const verifier = await createCliVerifier('codex').verify(node,{workspaceDir:process.cwd(),skillRootDir:process.cwd(),outputs:[],now:context.now});
  assert.equal(verifier.status,'unavailable');
  assert.equal(verifier.error,'codex verifier exited 1: '+reason);
  configure(JSON.stringify(events[0]),noise,true);
  const repair = await createCliExecutor('codex').execute(node,context);
  assert.equal(repair.error,'receipt-only repair did not complete: worker exited 1: '+reason);
  assert.equal(repair.outputs.length,1,'failed receipt repair must retain its candidate');
  console.log('structured fatal errors survive MCP noise with bounded sanitized fallback');
})();
`,
  );
  harness.runScript(
    "executor failures: fatal Codex events survive MCP noise without changing runtime authority",
    failureIntegration,
    [],
    0,
    "structured fatal errors survive MCP noise with bounded sanitized fallback",
  );

  const deadlineWorkspace = harness.makeTempDir("executor-deadlines");
  const deadlineBin = path.join(deadlineWorkspace, "bin");
  mkdirSync(deadlineBin);
  writeFileSync(path.join(deadlineWorkspace, "method.md"), "Produce the assigned local fixture output.");
  const deadlineCli = path.join(deadlineBin, "codex");
  writeFileSync(
    deadlineCli,
    `#!/usr/bin/env node
const fs = require('node:fs');
const crypto = require('node:crypto');
if (process.argv.includes('--version')) { console.log('fixture-runtime'); process.exit(0); }
const options = JSON.parse(fs.readFileSync('timing.json', 'utf8'));
const prompt = process.argv.at(-1);
const verifying = prompt.includes('BEGIN_VERIFICATION_VERDICT');
const repairing = prompt.includes('RECEIPT-ONLY REPAIR');
fs.appendFileSync('invocations', verifying ? 'verify\\n' : repairing ? 'repair\\n' : 'worker\\n');
fs.writeFileSync('worker-pid', String(process.pid));
if (options.authFallback && process.argv[1].endsWith('/codex')) {
  setTimeout(() => {
    if (options.exhaustContinuationDeadline) fs.writeFileSync('exhausted-deadline', 'expired');
    console.error('authentication required'); process.exit(1);
  }, options.delayMs);
  return;
}
if (options.descendant) {
  const child = require('node:child_process').spawn(process.execPath, ['-e', "process.on('SIGTERM', () => {}); setTimeout(() => require('node:fs').writeFileSync('interrupted-late-write', 'old worker wrote'), 900); setInterval(() => {}, 1000);"], {stdio:'ignore'});
  fs.writeFileSync('descendant-pid', String(child.pid));
}
setTimeout(() => {
  if (verifying) {
    console.log('BEGIN_VERIFICATION_VERDICT\\n' + JSON.stringify({schemaVersion:'1.0.0', workflowId:'workflow.deadline', verdict:'accepted', evidence:'Checked the current local fixture output.', repairWorkflowIds:[]}) + '\\nEND_VERIFICATION_VERDICT');
    return;
  }
  fs.writeFileSync('result.md', 'deadline fixture candidate');
  if (options.invalidFirst && !repairing) {
    if (options.exhaustContinuationDeadline) fs.writeFileSync('exhausted-deadline', 'expired');
    console.log('invalid receipt transport'); return;
  }
  const begin = 'BEGIN_KNOWLEDGE_RECEIPT', end = 'END_KNOWLEDGE_RECEIPT';
  const receipt = JSON.parse(prompt.slice(prompt.lastIndexOf(begin) + begin.length, prompt.lastIndexOf(end)).trim());
  for (const entry of receipt.mandatoryKnowledge) entry.sha256 = 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(entry.path)).digest('hex');
  for (const output of receipt.outputEvidence) { output.knowledgePaths = receipt.mandatoryKnowledge.map(entry => entry.path); output.summary = 'Produced the current local fixture output.'; }
  console.log(begin + '\\n' + JSON.stringify(receipt) + '\\n' + end);
}, repairing ? options.repairDelayMs : options.authFallback ? options.fallbackDelayMs : options.delayMs);
`,
  );
  chmodSync(deadlineCli, 0o755);
  symlinkSync(deadlineCli, path.join(deadlineBin, "claude"));
  symlinkSync(deadlineCli, path.join(deadlineBin, "cursor-agent"));
  const interruptedHost = path.join(deadlineWorkspace, "interrupted-host.ts");
  writeFileSync(
    interruptedHost,
    `
import { createCliExecutor } from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import { writeFileSync } from 'node:fs';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
process.chdir(process.argv[2]);
if (process.argv[3] === 'startup-kill') {
  const nativeSpawn = childProcess.spawn;
  childProcess.spawn = ((...args) => {
    const child = nativeSpawn(...args);
    if (args[0] === process.execPath && args[1]?.includes('--eval')) {
      writeFileSync('supervisor-pid', String(child.pid));
      process.kill(process.pid, 'SIGKILL');
    }
    return child;
  }) as typeof childProcess.spawn;
  syncBuiltinESMExports();
}
if (process.argv[3] === 'handled') process.on('SIGTERM', () => { writeFileSync('handled-signal', 'observed'); process.exit(42); });
process.on('message', (message) => { if (message === 'exit') process.exit(23); });
const node = { id:'deadline', workflowId:'workflow.deadline', title:'Interrupted fixture', reads:[], references:[{path:'method.md',title:'Fixture method',loadWhen:'before work'}], outputs:['result'], approvals:[], tokenBudget:12000, ttlSeconds:1, verification:{kind:'deterministic',gateIds:[],failClosed:true} } as any;
void createCliExecutor('codex').execute(node, {runId:'run',attemptId:'attempt',workspaceDir:process.cwd(),skillRootDir:process.cwd(),artifactPaths:{result:'result.md'},now:'2026-09-28T00:00:00Z',heartbeat() {}});
`,
  );
  const deadlineIntegration = path.join(deadlineWorkspace, "integration.ts");
  writeFileSync(
    deadlineIntegration,
    `
import assert from 'node:assert/strict';
import { createCliExecutor, createCliVerifier } from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
process.env.PATH = ${JSON.stringify(deadlineBin)} + ':' + process.env.PATH;
process.chdir(${JSON.stringify(deadlineWorkspace)});
const node = { id:'deadline', workflowId:'workflow.deadline', title:'Deadline fixture', reads:[], references:[{path:'method.md', title:'Fixture method', loadWhen:'before work'}], outputs:['result'], approvals:[], tokenBudget:12000, ttlSeconds:1, verification:{kind:'deterministic', gateIds:[], failClosed:true} } as any;
const context = { runId:'run', attemptId:'attempt', workspaceDir:process.cwd(), skillRootDir:process.cwd(), artifactPaths:{result:'result.md'}, now:'2026-09-28T00:00:00Z', heartbeat() {} };
const executor = createCliExecutor('codex');
const configure = (options) => { writeFileSync('timing.json', JSON.stringify(options)); writeFileSync('invocations', ''); rmSync('exhausted-deadline', {force:true}); };
// Startup and settlement may legitimately consume a short continuation budget under load.
// Advance only the host's deadline clock after the first real worker responds, leaving the
// separate real-timer cases below and successful continuation cases in the settlement fixture.
const withExpiredContinuation = async (execute) => {
  const now = Date.now;
  const deadline = now() + 30_000;
  Date.now = () => now() + (existsSync('exhausted-deadline') ? 60_000 : 0);
  try { return await execute(deadline); }
  finally { Date.now = now; }
};
const listenerCounts = ['SIGINT','SIGTERM','SIGHUP','exit'].map(signal => process.listenerCount(signal));
(async () => {
configure({delayMs:1200});
const beyondLease = await executor.execute(node, context);
assert.equal(beyondLease.status, 'succeeded', JSON.stringify(beyondLease));
const listenersAfterRun = ['SIGINT','SIGTERM','SIGHUP','exit'].map(signal => process.listenerCount(signal));
assert(
  listenersAfterRun.every((count, index) => count <= listenerCounts[index]!),
  'normal settlement must not leak host cleanup listeners; before='+JSON.stringify(listenerCounts)+', after='+JSON.stringify(listenersAfterRun),
);
configure({delayMs:1500});
const expired = await executor.execute(node, {...context, executionDeadlineAt:Date.now()-1});
assert.match(expired.error ?? '', /execution deadline exceeded/);
assert.equal(readFileSync('invocations', 'utf8'), '', 'expired session must not spawn a worker');
let heartbeats = 0;
const started = Date.now();
const timer = setInterval(() => { heartbeats++; context.heartbeat(); }, 10);
const timed = await executor.execute(node, {...context, executionDeadlineAt:started+400});
clearInterval(timer);
assert.match(timed.error ?? '', /execution deadline exceeded/);
assert(heartbeats > 0, 'fixture must send heartbeats while the worker is alive');
assert(Date.now()-started < 1200, 'heartbeats must not extend the execution deadline');
configure({delayMs:1500});
const explicit = await executor.execute({...node, executionTimeoutSeconds:0.4}, context);
assert.match(explicit.error ?? '', /execution deadline exceeded/, 'an explicit task bound must still stop work');
configure({delayMs:150, authFallback:true, fallbackDelayMs:1500, exhaustContinuationDeadline:true});
const fallback = await withExpiredContinuation(deadline => createCliExecutor('auto').execute(node, {...context, executionDeadlineAt:deadline}));
assert.match(fallback.error ?? '', /claude worker execution deadline exceeded/);
assert.equal(readFileSync('invocations', 'utf8'), 'worker\\n', 'selected auth fallback must not reset an exhausted dispatch deadline or start another worker');
configure({delayMs:1500});
const verification = await createCliVerifier('codex').verify(node, {workspaceDir:process.cwd(), skillRootDir:process.cwd(), outputs:beyondLease.outputs, now:context.now, executionDeadlineAt:Date.now()+400});
assert.equal(verification.status, 'unavailable', 'timeout is never an acceptance or a rejection');
assert.match(verification.error ?? '', /execution deadline exceeded/);
configure({delayMs:150, invalidFirst:true, repairDelayMs:1500, exhaustContinuationDeadline:true});
const repaired = await withExpiredContinuation(deadline => executor.execute(node, {...context, executionDeadlineAt:deadline}));
assert.match(repaired.error ?? '', /receipt-only repair.*execution deadline exceeded/);
assert.equal(repaired.outputs.length, 1, 'repair timeout must retain the candidate snapshot');
assert.equal(readFileSync('invocations', 'utf8'), 'worker\\n', 'receipt repair must not reset an exhausted dispatch deadline or start another worker');
if (process.platform !== 'win32') {
  const sibling = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'ignore'});
  let descendantPid;
  try {
    configure({delayMs:1500, descendant:true});
    const treeResult = await executor.execute(node, {...context, executionDeadlineAt:Date.now()+400});
    assert.match(treeResult.error ?? '', /execution deadline exceeded/);
    descendantPid = Number(readFileSync('descendant-pid', 'utf8'));
    let descendantAlive = true;
    for (let check = 0; check < 20 && descendantAlive; check++) {
      try { process.kill(descendantPid, 0); await new Promise(resolve => setTimeout(resolve, 25)); }
      catch (error) { if (error.code !== 'ESRCH') throw error; descendantAlive = false; }
    }
    assert.equal(descendantAlive, false, 'timed out worker must not leave a tool process running');
    assert.equal(sibling.exitCode, null, 'termination must preserve unrelated sibling processes');
    assert.equal(sibling.signalCode, null, 'termination must not signal the parent process group');
    process.kill(sibling.pid, 0);
  } finally {
    sibling.kill('SIGKILL');
    if (descendantPid) { try { process.kill(descendantPid, 'SIGKILL'); } catch {} }
  }
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (error) { if (error.code !== 'ESRCH') throw error; return false; } };
  for (const mode of ['SIGTERM','SIGINT','SIGHUP','SIGKILL','startup-kill','exit','handled']) {
    const directory = process.cwd() + '/interrupt-' + mode;
    mkdirSync(directory);
    writeFileSync(directory + '/method.md', 'Produce the assigned local fixture output.');
    writeFileSync(directory + '/timing.json', JSON.stringify({delayMs:60000, descendant:true}));
    const sibling = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {stdio:'ignore'});
    const host = spawn(process.execPath, ['--import','tsx',${JSON.stringify(interruptedHost)},directory,mode], {cwd:${JSON.stringify(skillRoot)},stdio:['ignore','ignore','pipe','ipc'],detached:true});
    let hostError = '';
    host.stderr.on('data', chunk => hostError += chunk);
    const exited = new Promise(resolve => host.once('exit', (code, signal) => resolve({code,signal})));
    let workerPid, descendantPid;
    try {
      const readyUntil = Date.now()+10000;
      const readyFile = mode === 'startup-kill' ? '/supervisor-pid' : '/descendant-pid';
      while (!existsSync(directory+readyFile) && Date.now()<readyUntil) {
        if (mode !== 'startup-kill') assert.equal(host.exitCode, null, 'fake host failed before dispatch: '+hostError);
        await new Promise(resolve => setTimeout(resolve,25));
      }
      assert(existsSync(directory+readyFile), 'fake host must dispatch before interruption: '+hostError);
      workerPid = Number(readFileSync(directory+(mode === 'startup-kill' ? '/supervisor-pid' : '/worker-pid'),'utf8'));
      descendantPid = mode === 'startup-kill' ? workerPid : Number(readFileSync(directory+'/descendant-pid','utf8'));
      if (mode === 'exit') host.send('exit');
      else if (mode !== 'startup-kill') process.kill(-host.pid, mode === 'handled' ? 'SIGTERM' : mode);
      let waitTimer;
      const outcome = await Promise.race([exited,new Promise((_, reject) => { waitTimer = setTimeout(() => reject(new Error('interrupted host did not exit')),5000); })]).finally(() => clearTimeout(waitTimer));
      if (mode === 'exit' || mode === 'handled') assert.equal(outcome.code, mode === 'exit' ? 23 : 42, 'existing host exit behavior must survive cleanup');
      else assert.equal(outcome.signal, mode === 'startup-kill' ? 'SIGKILL' : mode, 'default signal exit behavior must survive cleanup');
      for (let check=0; check<40 && (alive(workerPid)||alive(descendantPid)); check++) await new Promise(resolve => setTimeout(resolve,25));
      assert.equal(alive(workerPid), false, mode+' must terminate the detached worker');
      assert.equal(alive(descendantPid), false, mode+' must terminate the worker descendant');
      assert.equal(alive(sibling.pid), true, mode+' must preserve unrelated sibling processes');
      if (mode === 'SIGKILL' || mode === 'startup-kill') {
        await new Promise(resolve => setTimeout(resolve,1000));
        assert.equal(existsSync(directory+'/interrupted-late-write'),false,mode+' must prevent delayed writes after host death');
        if (mode === 'startup-kill') assert.equal(existsSync(directory+'/worker-pid'),false,'a disconnected supervisor must not start the worker');
      }
      if (mode === 'handled') assert.equal(readFileSync(directory+'/handled-signal','utf8'),'observed');
    } finally {
      for (const pid of [workerPid,descendantPid]) if (pid) { try { process.kill(pid,'SIGKILL'); } catch {} }
      try { process.kill(-host.pid,'SIGKILL'); } catch {}
      sibling.kill('SIGKILL');
    }
  }
}
const listenersAfterInterruptions = ['SIGINT','SIGTERM','SIGHUP','exit'].map(signal => process.listenerCount(signal));
assert(
  listenersAfterInterruptions.every((count, index) => count <= listenerCounts[index]!),
  'failed dispatches must not leak host cleanup listeners; before='+JSON.stringify(listenerCounts)+', after='+JSON.stringify(listenersAfterInterruptions),
);
console.log('lease independence, execution deadlines, review and receipt repair proved');
})();
`,
  );
  harness.runScript(
    "executor deadlines: fake CLI survives lease expiry, honors shared deadlines, and cleans up on host interruption",
    deadlineIntegration,
    [],
    0,
    "lease independence, execution deadlines, review and receipt repair proved",
  );
}

function registerProcessSettlement(harness: Harness): void {
  if (process.platform === "win32") {
    harness.skip("executor settlement: POSIX process groups", "Windows has no POSIX process-group ownership; this proof requires a POSIX host.");
    return;
  }
  const workspace = harness.makeTempDir("executor-process-settlement");
  const bin = path.join(workspace, "bin");
  mkdirSync(bin);
  writeFileSync(path.join(workspace, "method.md"), "Produce and independently inspect the assigned fixture output.");
  const cli = path.join(bin, "codex");
  writeFileSync(
    cli,
    `#!/usr/bin/env node
const fs = require('node:fs');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
if (process.argv.includes('--version')) { console.log('fixture-runtime'); process.exit(0); }
const options = JSON.parse(fs.readFileSync('options.json', 'utf8'));
const prompt = process.argv.at(-1);
const role = prompt.includes('BEGIN_VERIFICATION_VERDICT') ? 'verify' : prompt.includes('RECEIPT-ONLY REPAIR') ? 'repair' : 'worker';
const runtime = process.argv[1].split('/').at(-1);
const prior = fs.readFileSync('invocations', 'utf8').trim().split('\\n').filter(Boolean);
for (const entry of prior) {
  const pid = Number(entry.split(':').at(-1));
  try { process.kill(pid, 0); fs.writeFileSync('overlapping-worker', 'previous tool was still alive at next invocation'); } catch {}
}
const child = spawn(process.execPath, ['-e',
  "const fs=require('node:fs'); process.on('SIGTERM',()=>{}); fs.writeFileSync('ready-'+process.pid, 'ready'); setTimeout(()=>{fs.appendFileSync('late-write','old tool wrote\\\\n');},900); setInterval(()=>{},1000);"
], {stdio: options.inheritPipes ? ['ignore', 'inherit', 'inherit'] : 'ignore'});
child.unref();
fs.appendFileSync('invocations', role+':'+runtime+':'+child.pid+'\\n');
const ready = setInterval(() => {
  if (!fs.existsSync('ready-'+child.pid)) return;
  clearInterval(ready);
  if (options.fail || (options.fallback && runtime === 'codex')) {
    console.error(options.fallback ? 'authentication required' : 'fixture worker failed');
    process.exit(1);
  }
  if (role === 'verify') {
    console.log('BEGIN_VERIFICATION_VERDICT\\n'+JSON.stringify({schemaVersion:'1.0.0',workflowId:'workflow.settlement',verdict:'accepted',evidence:'Inspected current fixture bytes.',repairWorkflowIds:[]})+'\\nEND_VERIFICATION_VERDICT');
    process.exit(0);
  }
  if (role !== 'repair') fs.writeFileSync('result.md', 'current candidate');
  if (options.repair && role !== 'repair') { console.log('invalid receipt'); process.exit(0); }
  const begin='BEGIN_KNOWLEDGE_RECEIPT', end='END_KNOWLEDGE_RECEIPT';
  const receipt=JSON.parse(prompt.slice(prompt.lastIndexOf(begin)+begin.length,prompt.lastIndexOf(end)).trim());
  for(const entry of [...receipt.contractFiles,...receipt.taskArtifacts,...receipt.mandatoryKnowledge]) entry.sha256='sha256:'+crypto.createHash('sha256').update(fs.readFileSync(entry.path)).digest('hex');
  for(const output of receipt.outputEvidence) { output.knowledgePaths=receipt.mandatoryKnowledge.map(entry=>entry.path); output.summary='Produced the assigned fixture output.'; }
  const output=begin+'\\n'+JSON.stringify(receipt)+'\\n'+end;
  if(options.largeOutput) { process.stdout.write('fixture output '.repeat(20000)+'\\n'+output,()=>process.exit(0)); return; }
  console.log(output);
  process.exit(0);
},10);
`,
  );
  chmodSync(cli, 0o755);
  symlinkSync(cli, path.join(bin, "claude"));
  symlinkSync(cli, path.join(bin, "cursor-agent"));
  const integration = path.join(workspace, "integration.ts");
  writeFileSync(
    integration,
    `
import assert from 'node:assert/strict';
import {existsSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createCliExecutor,createCliVerifier} from ${JSON.stringify(path.join(skillRoot, "kernel/session/executor.ts"))};
import {isRetryableWorkerFailure} from ${JSON.stringify(path.join(skillRoot, "kernel/session/attempt-failure.ts"))};
process.env.PATH=${JSON.stringify(bin)}+':'+process.env.PATH;
process.chdir(${JSON.stringify(workspace)});
const node={id:'settlement',workflowId:'workflow.settlement',title:'Process settlement fixture',reads:[],references:[{path:'method.md',title:'Fixture method',loadWhen:'before work'}],outputs:['result'],approvals:[],tokenBudget:12000,ttlSeconds:10,verification:{kind:'deterministic',gateIds:[],failClosed:true}} as any;
const context={runId:'run',attemptId:'attempt',workspaceDir:process.cwd(),skillRootDir:process.cwd(),artifactPaths:{result:'result.md'},now:'2026-10-01T00:00:00Z',heartbeat(){}};
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const nativeKill=process.kill;
const sibling=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
const listeners=['SIGINT','SIGTERM','SIGHUP','exit'].map(signal=>process.listenerCount(signal));
const pids=()=>readFileSync('invocations','utf8').trim().split('\\n').filter(Boolean).map(line=>Number(line.split(':').at(-1)));
(async()=>{
try {
  for(const options of [{},{fail:true},{fallback:true},{repair:true},{verify:true},{inheritPipes:true},{largeOutput:true},{unconfirmed:true,fallback:true},{unconfirmed:true,repair:true},{unconfirmed:true,verify:true}]) {
    for(const file of ['late-write','overlapping-worker']) rmSync(file,{force:true});
    writeFileSync('options.json',JSON.stringify(options));
    writeFileSync('invocations','');
    let cleanupStarted;
    // Measure the final invocation's cleanup, excluding discovery, worker startup, and the
    // deliberate late-write observation below. Keep real process-group termination active.
    // For repair, let the first producer settle and deny the continuation's observation.
    process.kill=((pid,signal)=>{
      if(pid<0 && signal==='SIGKILL') cleanupStarted=Date.now();
      if(options.unconfirmed && pid<0 && signal===0 && (!options.repair || pids().length>1)) throw Object.assign(new Error('fixture observation denied'),{code:'EPERM'});
      return nativeKill(pid,signal);
    }) as typeof process.kill;
    const result=options.verify
      ? await createCliVerifier('auto').verify(node,{workspaceDir:process.cwd(),skillRootDir:process.cwd(),outputs:[],now:context.now})
      : await createCliExecutor('auto').execute(node,context);
    const cleanupElapsed=cleanupStarted===undefined?undefined:Date.now()-cleanupStarted;
    process.kill=nativeKill;
    try {
      assert(cleanupElapsed!==undefined && cleanupElapsed<3000,'owned-group cleanup must remain bounded: '+JSON.stringify({options,cleanupElapsed,result}));
      if(options.unconfirmed) {
        assert.equal(result.status,options.verify?'unavailable':'failed',JSON.stringify(result));
        assert.match(result.error??'',/settlement could not be confirmed/);
        assert.equal(isRetryableWorkerFailure(result.error),false,'uncertain process ownership must not schedule an automatic retry');
        assert.equal(pids().length,options.repair?2:1,'uncertain cleanup must stop authentication fallback and further continuations: '+JSON.stringify({options,result}));
        if(options.repair) assert.equal(result.outputs.length,1,'retain the unaccepted candidate on uncertain repair cleanup');
      } else {
        assert.equal(result.status,options.fail?'failed':options.verify?'accepted':'succeeded',JSON.stringify({options,result}));
        assert.equal(pids().length,options.repair||options.fallback?2:1);
        const invocations=readFileSync('invocations','utf8').trim().split('\\n').map(line=>line.split(':').slice(0,2).join(':'));
        if(options.fallback) assert.deepEqual(invocations,['worker:codex','worker:claude'],'available dispatch time must permit the selected auth fallback');
        if(options.repair) assert.deepEqual(invocations,['worker:codex','repair:codex'],'available dispatch time must permit same-runtime receipt repair');
      }
      await sleep(1050);
      assert.equal(existsSync('late-write'),false,'a completed CLI left a tool able to write after return: '+JSON.stringify(options));
      assert.equal(existsSync('overlapping-worker'),false,'retry or repair started while the prior tool was alive');
      for(const pid of pids()) assert.throws(()=>nativeKill(pid,0),{code:'ESRCH'},'tool process must stop before the caller continues');
      nativeKill(sibling.pid,0);
    } finally { for(const pid of pids()) { try { nativeKill(pid,'SIGKILL'); } catch {} } }
  }
  assert.deepEqual(['SIGINT','SIGTERM','SIGHUP','exit'].map(signal=>process.listenerCount(signal)),listeners,'settlement must remove temporary host handlers');
  console.log('producer, failure, fallback, repair and verifier groups settled before continuation');
} finally { process.kill=nativeKill; sibling.kill('SIGKILL'); for(const pid of pids()) { try { nativeKill(pid,'SIGKILL'); } catch {} } }
})();
`,
  );
  harness.runScript(
    "executor settlement: completed workers cannot leave writing tools or overlap continuations",
    integration,
    [],
    0,
    "producer, failure, fallback, repair and verifier groups settled before continuation",
  );
}
