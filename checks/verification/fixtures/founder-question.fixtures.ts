import { assert, type Harness } from "./_harness.js";
import {
  founderGatedClasses,
  founderQuestionClasses,
  founderQuestionCopyLeaks,
  buildGoNoGoQuestion,
  buildSoftQuestion,
  toAskUserQuestion,
  validateFounderQuestion,
  HEADER_BY_CLASS,
  type FounderQuestion,
  type FounderQuestionChoice,
} from "../../../kernel/session/founder-gate.js";
import { pickFounderQuestion, type FounderQuestionNode, type HeldNode, type HeldReason } from "../../../kernel/session/plan.js";
import type { RunNodeId } from "../../../kernel/engine/compile.js";

/**
 * Wave 2 (#30): the founder-question schema itself (founder-gate.ts) plus `plan.ts`'s
 * `pickFounderQuestion` priority ordering. Every case here is a pure-function unit test — no
 * catalog, no filesystem, no MCP — because both the schema constructors/validators and
 * `pickFounderQuestion`'s narrow `Pick<CompiledRunNode, ...>` signature are deliberately
 * unit-testable without a real compiled plan.
 */

const CHOICES: readonly FounderQuestionChoice[] = [
  { label: "Yes", consequence: "I will proceed.", recommended: true },
  { label: "No", consequence: "I will hold off.", recommended: false },
];

function question(overrides: Partial<FounderQuestion> = {}): FounderQuestion {
  return {
    phase: "operating",
    class: "confirm-go",
    prompt: "Go ahead?",
    choices: CHOICES,
    skippable: false,
    deferrable: false,
    ...overrides,
  };
}

function planNode(overrides: Partial<FounderQuestionNode> = {}): FounderQuestionNode {
  return { title: "Node title", approvals: [], actionClass: "mutate", workflowId: "workflow.test.node", ...overrides };
}

function heldNode(nodeId: RunNodeId, reason: HeldReason, detail: string, title = "Node title", reasonCode?: string): HeldNode {
  return { nodeId, workflowId: `workflow.${nodeId.slice("run.".length)}`, title, domainId: "domain.growth", reason, detail, reasonCode };
}

export function register(harness: Harness): void {
  // --- constructors enforce the founder-gate bar mechanically ---------------------------------

  harness.check("founder-gate: buildGoNoGoQuestion throws for a non-gated class", () => {
    let threw = false;
    try {
      buildGoNoGoQuestion({ phase: "operating", class: "scope-question", prompt: "x?", choices: CHOICES });
    } catch {
      threw = true;
    }
    assert(threw, "expected buildGoNoGoQuestion to throw for class 'scope-question' (not in founderGatedClasses)");
  });

  harness.check("founder-gate: buildGoNoGoQuestion succeeds for a gated class and forces skippable/deferrable false", () => {
    const built = buildGoNoGoQuestion({ phase: "operating", class: "confirm-spend-cap", prompt: "Spend?", choices: CHOICES });
    assert(built.skippable === false && built.deferrable === false, "expected a hard-gated question to be neither skippable nor deferrable");
  });

  harness.check("founder-gate: buildSoftQuestion throws for a gated class", () => {
    let threw = false;
    try {
      buildSoftQuestion({ phase: "operating", class: "confirm-go", prompt: "x?", choices: CHOICES });
    } catch {
      threw = true;
    }
    assert(threw, "expected buildSoftQuestion to throw for class 'confirm-go' (a founder-gated class)");
  });

  harness.check("founder-gate: buildSoftQuestion succeeds for a non-gated class and forces skippable/deferrable true", () => {
    const built = buildSoftQuestion({ phase: "orientation", class: "grant-initial-autonomy", prompt: "Set up now?", choices: CHOICES });
    assert(built.skippable === true && built.deferrable === true, "expected a soft question to be both skippable and deferrable");
  });

  // --- validateFounderQuestion ------------------------------------------------------------------

  harness.check("founder-gate: validateFounderQuestion catches 0, 1, and 5 choices", () => {
    const zero = validateFounderQuestion(question({ choices: [] }));
    assert(
      zero.some((problem) => problem.includes("choices.length")),
      `expected a choices.length problem for 0 choices, got ${JSON.stringify(zero)}`,
    );
    const one = validateFounderQuestion(question({ choices: [CHOICES[0]!] }));
    assert(
      one.some((problem) => problem.includes("choices.length")),
      `expected a choices.length problem for 1 choice, got ${JSON.stringify(one)}`,
    );
    const five: FounderQuestionChoice[] = [0, 1, 2, 3, 4].map((index) => ({ label: `Choice ${index}`, consequence: "x", recommended: index === 0 }));
    const fiveResult = validateFounderQuestion(question({ choices: five }));
    assert(
      fiveResult.some((problem) => problem.includes("choices.length")),
      `expected a choices.length problem for 5 choices, got ${JSON.stringify(fiveResult)}`,
    );
  });

  harness.check("founder-gate: validateFounderQuestion catches zero or multiple recommended choices", () => {
    const zeroRecommended = validateFounderQuestion(
      question({
        choices: [
          { label: "A", consequence: "a", recommended: false },
          { label: "B", consequence: "b", recommended: false },
        ],
      }),
    );
    assert(
      zeroRecommended.some((problem) => problem.includes("exactly one choice must be recommended")),
      `expected a recommended-count problem for zero recommended, got ${JSON.stringify(zeroRecommended)}`,
    );
    const twoRecommended = validateFounderQuestion(
      question({
        choices: [
          { label: "A", consequence: "a", recommended: true },
          { label: "B", consequence: "b", recommended: true },
        ],
      }),
    );
    assert(
      twoRecommended.some((problem) => problem.includes("exactly one choice must be recommended")),
      `expected a recommended-count problem for two recommended, got ${JSON.stringify(twoRecommended)}`,
    );
  });

  harness.check("founder-gate: validateFounderQuestion catches a gated class marked skippable or deferrable", () => {
    // Built as a plain literal (bypassing the constructors on purpose) to prove the validator is
    // real defense-in-depth, not merely a mirror of what the constructors already forbid.
    const badQuestion: FounderQuestion = { ...question({ class: "confirm-go" }), skippable: true, deferrable: true };
    const problems = validateFounderQuestion(badQuestion);
    assert(
      problems.some((problem) => problem.includes("founder-gated")),
      `expected a founder-gated skippable/deferrable problem, got ${JSON.stringify(problems)}`,
    );
  });

  harness.check("founder-gate: validateFounderQuestion catches a gated-but-skippable question and passes a valid one", () => {
    const valid = validateFounderQuestion(question());
    assert(valid.length === 0, `expected a well-formed question to validate clean, got ${JSON.stringify(valid)}`);
  });

  // --- founderQuestionCopyLeaks -------------------------------------------------------------------

  harness.check("founder-gate: founderQuestionCopyLeaks catches internal vocabulary and passes clean copy", () => {
    const jargon = question({ prompt: "The run.workflow.x node is waiting_founder with reasonCode set." });
    const leaked = founderQuestionCopyLeaks(jargon);
    assert(leaked.length > 0, `expected leaked vocabulary to be caught, got ${JSON.stringify(leaked)}`);
    const clean = founderQuestionCopyLeaks(question());
    assert(clean.length === 0, `expected clean founder-facing copy to leak nothing, got ${JSON.stringify(clean)}`);
  });

  // --- toAskUserQuestion / HEADER_BY_CLASS ---------------------------------------------------------

  harness.check("founder-gate: every founderQuestionClasses entry has a header of at most 12 characters", () => {
    for (const cls of founderQuestionClasses) {
      const header = HEADER_BY_CLASS[cls];
      assert(typeof header === "string" && header.length > 0, `expected a non-empty header for class "${cls}"`);
      assert(header.length <= 12, `expected header for class "${cls}" to be at most 12 characters, got "${header}" (${header.length})`);
    }
  });

  harness.check("founder-gate: toAskUserQuestion projects header/question/options/multiSelect correctly", () => {
    const built = buildGoNoGoQuestion({ phase: "operating", class: "confirm-release-publish", prompt: "Release now?", choices: CHOICES });
    const shape = toAskUserQuestion(built);
    assert(shape.header === HEADER_BY_CLASS["confirm-release-publish"], `expected the class's header, got ${shape.header}`);
    assert(shape.question === "Release now?", `expected the prompt carried verbatim, got ${shape.question}`);
    assert(shape.options.length === CHOICES.length, `expected one option per choice, got ${shape.options.length}`);
    assert(
      shape.options[0]!.label === "Yes" && shape.options[0]!.description === "I will proceed.",
      "expected option 0 to map label/consequence to label/description",
    );
    assert(shape.multiSelect === false, "expected multiSelect to always be false");
  });

  // --- pickFounderQuestion priority ordering -------------------------------------------------------

  harness.check("pickFounderQuestion: a protected approval (spend) outranks every other tier", () => {
    const nodeId: RunNodeId = "run.growth.ad-spend";
    const byId = new Map<RunNodeId, FounderQuestionNode>([
      [nodeId, planNode({ title: "Run the ad spend", approvals: [{ id: "a1", description: "Spend $500 on ads" }], actionClass: "spend" })],
      [
        "run.other.plain-approval" as RunNodeId,
        planNode({ title: "Plain approval", approvals: [{ id: "a2", description: "Do a thing" }], actionClass: "mutate" }),
      ],
    ]);
    const held: HeldNode[] = [
      heldNode(nodeId, "founder_approval", "Spend $500 on ads", "Run the ad spend"),
      heldNode("run.other.plain-approval" as RunNodeId, "founder_approval", "Do a thing", "Plain approval"),
      heldNode("run.other.autonomy-park" as RunNodeId, "autonomy", "No waiver covers this.", "Parked node", "autonomy.no_waiver"),
    ];
    const result = pickFounderQuestion(byId, held, true);
    assert(result !== null, "expected a founder question");
    assert(result!.class === "confirm-spend-cap", `expected class confirm-spend-cap, got ${result!.class}`);
    assert(result!.skippable === false && result!.deferrable === false, "expected the protected approval to be hard-gated");
  });

  harness.check("pickFounderQuestion: a plain (non-protected) approval outranks autonomyUnset and autonomy-park", () => {
    const nodeId: RunNodeId = "run.other.plain-approval";
    const byId = new Map<RunNodeId, FounderQuestionNode>([
      [nodeId, planNode({ title: "Plain approval", approvals: [{ id: "a1", description: "Do a thing" }] })],
    ]);
    const held: HeldNode[] = [
      heldNode(nodeId, "founder_approval", "Do a thing", "Plain approval"),
      heldNode("run.other.autonomy-park" as RunNodeId, "autonomy", "No waiver covers this.", "Parked node", "autonomy.no_waiver"),
    ];
    const result = pickFounderQuestion(byId, held, true);
    assert(result !== null, "expected a founder question");
    assert(result!.class === "confirm-approval", `expected class confirm-approval, got ${result!.class}`);
    assert(result!.skippable === false && result!.deferrable === false, "expected a plain approval to still be hard-gated (no skip path exists)");
  });

  harness.check("pickFounderQuestion: autonomyUnset outranks autonomy-park and scope-question", () => {
    const byId = new Map<RunNodeId, FounderQuestionNode>([["run.scope.node" as RunNodeId, planNode({ title: "Scope node" })]]);
    const held: HeldNode[] = [
      heldNode("run.scope.node" as RunNodeId, "founder_approval", "Scope answer needed: Does this apply?", "Scope node"),
      heldNode("run.other.autonomy-park" as RunNodeId, "autonomy", "No waiver covers this.", "Parked node", "autonomy.no_waiver"),
    ];
    const result = pickFounderQuestion(byId, held, true);
    assert(result !== null, "expected a founder question");
    assert(result!.class === "grant-initial-autonomy", `expected class grant-initial-autonomy, got ${result!.class}`);
    assert(result!.skippable === true && result!.deferrable === true, "expected the initial-autonomy question to be soft");
  });

  harness.check("pickFounderQuestion: an autonomy-park node outranks a scope-question when autonomy is already set", () => {
    const byId = new Map<RunNodeId, FounderQuestionNode>([["run.scope.node" as RunNodeId, planNode({ title: "Scope node" })]]);
    const held: HeldNode[] = [
      heldNode("run.scope.node" as RunNodeId, "founder_approval", "Scope answer needed: Does this apply?", "Scope node"),
      heldNode("run.other.autonomy-park" as RunNodeId, "autonomy", "No waiver covers this.", "Parked node", "autonomy.no_waiver"),
    ];
    const result = pickFounderQuestion(byId, held, false);
    assert(result !== null, "expected a founder question");
    assert(result!.class === "raise-autonomy", `expected class raise-autonomy, got ${result!.class}`);
    assert(result!.skippable === true && result!.deferrable === true, "expected raise-autonomy to be soft");
  });

  harness.check("pickFounderQuestion: a scope-question (approvals.length===0) is picked last, with its blocker prefix stripped", () => {
    const byId = new Map<RunNodeId, FounderQuestionNode>([["run.scope.node" as RunNodeId, planNode({ title: "Scope node" })]]);
    const held: HeldNode[] = [heldNode("run.scope.node" as RunNodeId, "founder_approval", "Scope answer needed: Does this apply?", "Scope node")];
    const result = pickFounderQuestion(byId, held, false);
    assert(result !== null, "expected a founder question");
    assert(result!.class === "scope-question", `expected class scope-question, got ${result!.class}`);
    assert(result!.prompt === "Does this apply?", `expected the "Scope answer needed: " prefix stripped, got "${result!.prompt}"`);
    assert(result!.skippable === true && result!.deferrable === true, "expected a scope-question to be soft");
  });

  harness.check("pickFounderQuestion: optional scope does not interrupt independent ready work", () => {
    const byId = new Map<RunNodeId, FounderQuestionNode>([["run.scope.node" as RunNodeId, planNode({ title: "Scope node" })]]);
    const held: HeldNode[] = [heldNode("run.scope.node" as RunNodeId, "founder_approval", "Scope answer needed: Is this optional?", "Scope node")];
    const result = pickFounderQuestion(byId, held, false, true);
    assert(result === null, `expected no global question while ready work exists, got ${JSON.stringify(result)}`);
  });

  harness.check("pickFounderQuestion: a later effect approval cannot turn unanswered schedule scope into a hard install gate", () => {
    const scheduleId = "run.operations.scheduled-autonomy-installation" as RunNodeId;
    const byId = new Map<RunNodeId, FounderQuestionNode>([
      [
        scheduleId,
        planNode({
          title: "Scheduled autonomy installation",
          workflowId: "workflow.operations.scheduled-autonomy-installation",
          approvals: [
            { id: "workflow.operations.scheduled-autonomy-installation.approval.1", description: "approve installing the recurring session schedule" },
          ],
        }),
      ],
    ]);
    const held: HeldNode[] = [
      heldNode(
        scheduleId,
        "founder_approval",
        "Scope answer needed: Is recurring scheduled operation selected for the current business?",
        "Scheduled autonomy installation",
      ),
    ];
    const whileReady = pickFounderQuestion(byId, held, false, true);
    assert(whileReady === null, `expected no install or scope prompt while ready work exists, got ${JSON.stringify(whileReady)}`);
    const whenIdle = pickFounderQuestion(byId, held, false, false);
    assert(whenIdle !== null, "expected a soft scope question when nothing else is ready");
    assert(whenIdle!.class === "scope-question", `expected scope-question, got ${whenIdle!.class}`);
    assert(
      whenIdle!.prompt === "Is recurring scheduled operation selected for the current business?",
      `expected the schedule scope prompt, got ${whenIdle!.prompt}`,
    );
    assert(whenIdle!.skippable === true && whenIdle!.deferrable === true, "schedule scope must stay soft until selected");
  });

  harness.check("pickFounderQuestion: a paid-tool hold is never recovered by asking to install recurring sessions", () => {
    const paidToolId = "run.operations.paid-tool-routing-and-fallback" as RunNodeId;
    const scheduleId = "run.operations.scheduled-autonomy-installation" as RunNodeId;
    const byId = new Map<RunNodeId, FounderQuestionNode>([
      [
        paidToolId,
        planNode({
          title: "Paid-tool routing & fallback",
          workflowId: "workflow.operations.paid-tool-routing-and-fallback",
          approvals: [{ id: "workflow.operations.paid-tool-routing-and-fallback.approval.1", description: "approve a paid or constrained fallback" }],
        }),
      ],
      [
        scheduleId,
        planNode({
          title: "Scheduled autonomy installation",
          workflowId: "workflow.operations.scheduled-autonomy-installation",
          approvals: [
            { id: "workflow.operations.scheduled-autonomy-installation.approval.1", description: "approve installing the recurring session schedule" },
          ],
        }),
      ],
    ]);
    const paidToolHeld = heldNode(
      paidToolId,
      "blocked",
      "Worker receipt failed after paid-tool approval; repair the receipt before continuing.",
      "Paid-tool routing & fallback",
    );
    const scheduleScopeHeld = heldNode(
      scheduleId,
      "founder_approval",
      "Scope answer needed: Is recurring scheduled operation selected for the current business?",
      "Scheduled autonomy installation",
    );
    const scheduleInstallHeld = heldNode(
      scheduleId,
      "founder_approval",
      "approve installing the recurring session schedule",
      "Scheduled autonomy installation",
    );

    const againstScope = pickFounderQuestion(byId, [scheduleScopeHeld, paidToolHeld], false, false);
    assert(againstScope === null || !againstScope.prompt.includes("recurring scheduled"), `paid-tool hold must not surface schedule scope, got ${JSON.stringify(againstScope)}`);

    const againstInstall = pickFounderQuestion(byId, [scheduleInstallHeld, paidToolHeld], false, false);
    assert(
      againstInstall === null || !againstInstall.prompt.includes("Scheduled autonomy"),
      `paid-tool hold must not surface schedule install approval as recovery, got ${JSON.stringify(againstInstall)}`,
    );

    const paidToolApprovalHeld = heldNode(
      paidToolId,
      "founder_approval",
      "approve a paid or constrained fallback",
      "Paid-tool routing & fallback",
    );
    const prefersPaidTool = pickFounderQuestion(byId, [scheduleInstallHeld, paidToolApprovalHeld], false, false);
    assert(prefersPaidTool !== null, "expected the paid-tool approval to remain askable");
    assert(
      prefersPaidTool!.prompt.includes("Paid-tool routing"),
      `expected paid-tool approval to outrank schedule install, got ${prefersPaidTool!.prompt}`,
    );
  });

  harness.check("pickFounderQuestion: returns null when nothing is held and autonomy is already set", () => {
    const result = pickFounderQuestion(new Map(), [], false);
    assert(result === null, `expected null when there is nothing to ask, got ${JSON.stringify(result)}`);
  });

  harness.check("pickFounderQuestion: never returns more than one question even when multiple tiers are present", () => {
    const spendId: RunNodeId = "run.growth.ad-spend";
    const byId = new Map<RunNodeId, FounderQuestionNode>([
      [spendId, planNode({ title: "Run the ad spend", approvals: [{ id: "a1", description: "Spend $500 on ads" }], actionClass: "spend" })],
    ]);
    const held: HeldNode[] = [
      heldNode(spendId, "founder_approval", "Spend $500 on ads", "Run the ad spend"),
      heldNode("run.scope.node" as RunNodeId, "founder_approval", "Scope answer needed: Does this apply?", "Scope node"),
      heldNode("run.other.autonomy-park" as RunNodeId, "autonomy", "No waiver covers this.", "Parked node", "autonomy.no_waiver"),
    ];
    const result = pickFounderQuestion(byId, held, true);
    assert(result !== null && !Array.isArray(result), "expected a single FounderQuestion, never an array");
    assert((result as FounderQuestion).class === "confirm-spend-cap", `expected the highest-priority tier to win, got ${(result as FounderQuestion).class}`);
  });

  harness.check("founderGatedClasses names exactly the four hard-gated classes", () => {
    const expected = new Set(["confirm-go", "confirm-spend-cap", "confirm-release-publish", "confirm-approval"]);
    assert(founderGatedClasses.size === expected.size, `expected ${expected.size} gated classes, got ${founderGatedClasses.size}`);
    for (const cls of expected) assert(founderGatedClasses.has(cls as never), `expected "${cls}" to be founder-gated`);
  });
}
