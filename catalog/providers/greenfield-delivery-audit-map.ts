/**
 * Greenfield delivery-audit framework map (#66 / U4-1 umbrella).
 *
 * Tip residual ownership, three-pillar honesty (intent / measurable overhead /
 * e2e proof-class), and U4 remaining sequence lock. Does **not** implement
 * sibling issues, run a live greenfield benchmark, consolidate workflows,
 * invent search/vector infra, or start U5/#511.
 *
 * Consumes landed surfaces (do not rebuild / do not invent a second ontology):
 * - checks/verification/fixtures/proof-strength.fixtures.ts (#74 CLOSED)
 * - checks/verification/fixtures/complete-business-benchmark.fixtures.ts
 * - checks/verification/rehearsal/greenfield-benchmark.md (#72 protocol; live held)
 * - checks/verification/rehearsal/workflow-overhead-boundaries.md (#73 Stage A retain)
 * - checks/verification/rehearsal/EVIDENCE.md (fixtures ≠ live)
 * - checks/verification/public-api/lifecycle.test.ts + initialization.test.ts
 * - examples/tuck evidence limits
 *
 * After #66 close: STOP → #70 deepen separate. Skip #74 CLOSED. Live → #72.
 */
export const GREENFIELD_66_MAP_PATH = "catalog/providers/greenfield-delivery-audit-map.ts" as const;
export const GREENFIELD_66_AUDIT_DOC = "checks/verification/rehearsal/greenfield-delivery-audit-66.md" as const;
export const GREENFIELD_66_FIXTURE_SUITE = "checks/verification/fixtures/greenfield-delivery-audit-66.fixtures.ts" as const;

export const PROOF_STRENGTH_FIXTURE = "checks/verification/fixtures/proof-strength.fixtures.ts" as const;
export const COMPLETE_BUSINESS_FIXTURE = "checks/verification/fixtures/complete-business-benchmark.fixtures.ts" as const;
export const GREENFIELD_BENCHMARK_PROTOCOL = "checks/verification/rehearsal/greenfield-benchmark.md" as const;
export const WORKFLOW_OVERHEAD_BOUNDARIES = "checks/verification/rehearsal/workflow-overhead-boundaries.md" as const;
export const REHEARSAL_EVIDENCE_DOC = "checks/verification/rehearsal/EVIDENCE.md" as const;
export const LIFECYCLE_PUBLIC_TEST = "checks/verification/public-api/lifecycle.test.ts" as const;
export const INITIALIZATION_PUBLIC_TEST = "checks/verification/public-api/initialization.test.ts" as const;

export const GREENFIELD_66_BASE_MAIN_SHA = "d3bd0b5fba5381bb4787bfeb79e3f3c9cc5dbfeb" as const;
export const GREENFIELD_66_STAMP = "0.221.25" as const;
export const GREENFIELD_66_UMBRELLA_ISSUE = "#66" as const;

export const GREENFIELD_66_PILLARS = ["intent-preservation", "overhead-measurable", "e2e-proof-framework"] as const;
export type Greenfield66Pillar = (typeof GREENFIELD_66_PILLARS)[number];

export const GREENFIELD_66_PROOF_CLASSES = [
  "fixture",
  "screenshot",
  "protocol-doc",
  "lifecycle-public-test",
  "criteria-frozen-authoring",
  "delivery-accepted",
  "submission-readiness",
  "submitted",
  "released",
  "live-complete-business",
  "publish-of-evidence",
] as const;
export type Greenfield66ProofClass = (typeof GREENFIELD_66_PROOF_CLASSES)[number];

export const GREENFIELD_66_INTENT_DISPOSITIONS = [
  "accepted-scope-authoritative",
  "craft-authoritative",
  "docs-padding-rejected",
  "structural-only-not-intent",
  "semantic-review-required",
  "runtime-observation-required",
] as const;
export type Greenfield66IntentDisposition = (typeof GREENFIELD_66_INTENT_DISPOSITIONS)[number];

export const GREENFIELD_66_OVERHEAD_DISPOSITIONS = [
  "measurable-required",
  "stage-a-retain",
  "workflow-count-alone-rejected",
  "consolidation-deferred-to-73",
  "observed-cost-unknown",
] as const;
export type Greenfield66OverheadDisposition = (typeof GREENFIELD_66_OVERHEAD_DISPOSITIONS)[number];

export const GREENFIELD_66_CHILD_STATES = ["closed", "open"] as const;
export type Greenfield66ChildState = (typeof GREENFIELD_66_CHILD_STATES)[number];

export const GREENFIELD_66_OWNERSHIP = ["closed-child-landed", "open-child-residual", "umbrella-framework", "founder-held"] as const;
export type Greenfield66Ownership = (typeof GREENFIELD_66_OWNERSHIP)[number];

export interface Greenfield66ChildRow {
  readonly issue: `#${number}`;
  readonly state: Greenfield66ChildState;
  readonly title: string;
  readonly ownership: Greenfield66Ownership;
  readonly pillarTouch: readonly Greenfield66Pillar[] | readonly ["none"];
  readonly proofClassFocus: Greenfield66ProofClass | "n/a";
  readonly residualNote: string;
  readonly implementIn66: false;
}

export const GREENFIELD_66_CHILDREN: readonly Greenfield66ChildRow[] = [
  {
    issue: "#67",
    state: "closed",
    title: "Make onboarding funnel and billing requirements follow the accepted product and selected providers",
    ownership: "closed-child-landed",
    pillarTouch: ["intent-preservation"],
    proofClassFocus: "n/a",
    residualNote: "Landed; do not reopen.",
    implementIn66: false,
  },
  {
    issue: "#68",
    state: "closed",
    title: "Preserve actionable blockers, dispatch briefs, and founder questions in business-plan",
    ownership: "closed-child-landed",
    pillarTouch: ["intent-preservation"],
    proofClassFocus: "n/a",
    residualNote: "Landed; do not reopen.",
    implementIn66: false,
  },
  {
    issue: "#69",
    state: "closed",
    title: "Align onboarding design instructions with DESIGN.md ownership and selected platform scope",
    ownership: "closed-child-landed",
    pillarTouch: ["intent-preservation"],
    proofClassFocus: "n/a",
    residualNote: "Landed; do not reopen.",
    implementIn66: false,
  },
  {
    issue: "#74",
    state: "closed",
    title: "Distinguish structural, semantic, and runtime proof and replace misleading document-padding gates",
    ownership: "closed-child-landed",
    pillarTouch: ["intent-preservation", "e2e-proof-framework"],
    proofClassFocus: "fixture",
    residualNote: "proof-strength.fixtures — structural ≠ semantic ≠ runtime; skip (CLOSED).",
    implementIn66: false,
  },
  {
    issue: "#77",
    state: "closed",
    title: "Clarify graph responsibilities and derive redundant agent-overlay fields from the catalog",
    ownership: "closed-child-landed",
    pillarTouch: ["overhead-measurable"],
    proofClassFocus: "n/a",
    residualNote: "Landed; do not reopen.",
    implementIn66: false,
  },
  {
    issue: "#78",
    state: "closed",
    title: "Make framework and knowledge expansion earn its complexity through observed failures and measured outcomes",
    ownership: "closed-child-landed",
    pillarTouch: ["overhead-measurable"],
    proofClassFocus: "n/a",
    residualNote: "Landed; do not reopen.",
    implementIn66: false,
  },
  {
    issue: "#70",
    state: "open",
    title: "Scope design techniques, reference providers, and audits to the product surface and selected recipe",
    ownership: "open-child-residual",
    pillarTouch: ["intent-preservation"],
    proofClassFocus: "n/a",
    residualNote: "Next deepen after #66 close — separate paper.",
    implementIn66: false,
  },
  {
    issue: "#71",
    state: "open",
    title: "Prove the greenfield planning-to-execution handoff and make authorized stop lines explicit",
    ownership: "open-child-residual",
    pillarTouch: ["intent-preservation", "e2e-proof-framework"],
    proofClassFocus: "lifecycle-public-test",
    residualNote: "Isolated handoff regressions; public lifecycle/init already on tip.",
    implementIn66: false,
  },
  {
    issue: "#73",
    state: "open",
    title: "Measure workflow overhead and consolidate low-value dispatch boundaries without reducing product scope",
    ownership: "open-child-residual",
    pillarTouch: ["overhead-measurable"],
    proofClassFocus: "protocol-doc",
    residualNote: "Stage A retain on tip; measured consolidation later — not in #66.",
    implementIn66: false,
  },
  {
    issue: "#75",
    state: "open",
    title: "Evaluate knowledge retrieval through worker context and task outcomes before adding search infrastructure",
    ownership: "open-child-residual",
    pillarTouch: ["overhead-measurable"],
    proofClassFocus: "n/a",
    residualNote: "Default no-change until measured; no new vector infra in #66.",
    implementIn66: false,
  },
  {
    issue: "#76",
    state: "open",
    title: "Prove business-change impact propagation from evidence and product decisions to downstream acceptance",
    ownership: "open-child-residual",
    pillarTouch: ["intent-preservation"],
    proofClassFocus: "n/a",
    residualNote: "Internet monitoring / legal auto-approval later — not in #66.",
    implementIn66: false,
  },
  {
    issue: "#72",
    state: "open",
    title: "Run a real greenfield complete-business benchmark and publish intervention-aware evidence",
    ownership: "open-child-residual",
    pillarTouch: ["e2e-proof-framework"],
    proofClassFocus: "live-complete-business",
    residualNote: "Live run + publish-of-evidence LAST; protocol on tip is progress ≠ completion.",
    implementIn66: false,
  },
] as const;

export const GREENFIELD_66_CLOSED_CHILDREN = ["#67", "#68", "#69", "#74", "#77", "#78"] as const;
export const GREENFIELD_66_OPEN_CHILDREN = ["#70", "#71", "#72", "#73", "#75", "#76"] as const;

/** U4 remaining order after #66. Skip #74 CLOSED. No U5/#511. #72 last. */
export const GREENFIELD_66_U4_REMAINING_SEQUENCE = ["#70", "#71", "#73", "#75", "#76", "#72"] as const;
export type Greenfield66SequenceIssue = (typeof GREENFIELD_66_U4_REMAINING_SEQUENCE)[number];

export const GREENFIELD_66_SKIP_CLOSED = "#74" as const;
export const GREENFIELD_66_NEXT_AFTER_CLOSE = "#70" as const;
export const GREENFIELD_66_LIVE_OWNER = "#72" as const;
export const GREENFIELD_66_NO_U5 = "#511" as const;

export interface Greenfield66ProgramAcceptanceRow {
  readonly id: string;
  readonly statement: string;
  readonly ownership: Greenfield66Ownership;
  readonly ownerIssue: `#${number}` | "#66-framework" | "founder";
  readonly statusOnTip: "landed-via-closed-child" | "framework-in-66" | "residual-open-child" | "founder-held";
}

export const GREENFIELD_66_PROGRAM_ACCEPTANCE: readonly Greenfield66ProgramAcceptanceRow[] = [
  {
    id: "pa-audit-point-maps",
    statement: "Every actionable audit point maps to a child issue or an existing owner.",
    ownership: "umbrella-framework",
    ownerIssue: "#66-framework",
    statusOnTip: "framework-in-66",
  },
  {
    id: "pa-child-handoffs",
    statement: "Every child has an implementation/evaluation handoff with concrete entry points.",
    ownership: "umbrella-framework",
    ownerIssue: "#66-framework",
    statusOnTip: "framework-in-66",
  },
  {
    id: "pa-defects-fixed-or-rejected",
    statement: "Confirmed defects are fixed and verified, or explicitly rejected with evidence.",
    ownership: "open-child-residual",
    ownerIssue: "#70",
    statusOnTip: "residual-open-child",
  },
  {
    id: "pa-recommendations-measured",
    statement: "Recommendations are measured rather than turned into compulsory architecture.",
    ownership: "open-child-residual",
    ownerIssue: "#73",
    statusOnTip: "residual-open-child",
  },
  {
    id: "pa-real-business-run-separates-classes",
    statement: "A real business run separates product delivery, submission readiness, submission, release, and live results.",
    ownership: "open-child-residual",
    ownerIssue: "#72",
    statusOnTip: "residual-open-child",
  },
  {
    id: "pa-founder-vs-builder-rescues",
    statement: "Founder decisions/external dependencies are separated from avoidable builder rescues.",
    ownership: "open-child-residual",
    ownerIssue: "#71",
    statusOnTip: "residual-open-child",
  },
  {
    id: "pa-simplification-preserves-scope",
    statement: "Simplification preserves complete accepted scope, craft, authority, evidence freshness, recovery, and independent review.",
    ownership: "open-child-residual",
    ownerIssue: "#73",
    statusOnTip: "residual-open-child",
  },
] as const;

export const GREENFIELD_66_PILLAR_NOTES = {
  "intent-preservation":
    "Accepted product scope and craft stay authoritative. Intent ≠ docs padding / packet shape / checklist density. Consume #74 proof-strength (structural ≠ semantic ≠ runtime). No second proof ontology.",
  "overhead-measurable":
    "Avoidable dispatch/context/handoff cost is measurable. Workflow-count reduction alone is not success. Consume #73 Stage A retain until a #72 interval exists. No consolidation in #66.",
  "e2e-proof-framework":
    "delivery-accepted ≠ submission-readiness ≠ submitted ≠ released ≠ live-complete-business. Fixture / screenshot / protocol-alone ≠ live. liveLaunchProven must not flip from synthetic success. Live + publish-of-evidence → #72.",
} as const satisfies Record<Greenfield66Pillar, string>;

export const GREENFIELD_66_HARD_HOLDS = [
  "live-greenfield-benchmark",
  "publish-of-evidence",
  "liveLaunchProven-from-synthetic",
  "sibling-implementation",
  "workflow-consolidation",
  "search-vector-infra",
  "second-planner-scheduler-execution-store",
  "second-proof-ontology",
  "u5-511",
  "formation",
  "app-review",
  "prices",
  "credentials",
  "reopen-closed-children",
  "claim-complete-business-from-ci-fixtures-tuck-protocol",
] as const;
export type Greenfield66HardHold = (typeof GREENFIELD_66_HARD_HOLDS)[number];

export const GREENFIELD_66_DISTINCT_PROOF_NOTE =
  "fixture ≠ screenshot ≠ protocol-doc ≠ lifecycle-public-test ≠ criteria-frozen-authoring ≠ delivery-accepted ≠ submission-readiness ≠ submitted ≠ released ≠ live-complete-business ≠ publish-of-evidence" as const;

export const GREENFIELD_66_SEQUENCE_LOCK_NOTE =
  "After #66: #70 → #71 → #73 → #75 → #76 → #72 last; skip #74 CLOSED; no U5/#511; one-issue WIP/deepen; umbrella close does not close children." as const;

export function getGreenfield66Children(): readonly Greenfield66ChildRow[] {
  return GREENFIELD_66_CHILDREN;
}

export function greenfield66ChildRow(issue: string): Greenfield66ChildRow {
  const row = GREENFIELD_66_CHILDREN.find((entry) => entry.issue === issue);
  if (!row) throw new Error(`unknown greenfield #66 child: ${issue}`);
  return row;
}

export function greenfield66ClosedChildren(): readonly Greenfield66ChildRow[] {
  return GREENFIELD_66_CHILDREN.filter((row) => row.state === "closed");
}

export function greenfield66OpenChildren(): readonly Greenfield66ChildRow[] {
  return GREENFIELD_66_CHILDREN.filter((row) => row.state === "open");
}

export function greenfield66SequenceIndex(issue: Greenfield66SequenceIssue): number {
  return GREENFIELD_66_U4_REMAINING_SEQUENCE.indexOf(issue);
}

export function greenfield66SequenceIsLocked(): boolean {
  return (
    GREENFIELD_66_U4_REMAINING_SEQUENCE.length === 6 &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[0] === "#70" &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[1] === "#71" &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[2] === "#73" &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[3] === "#75" &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[4] === "#76" &&
    GREENFIELD_66_U4_REMAINING_SEQUENCE[5] === "#72" &&
    GREENFIELD_66_SKIP_CLOSED === "#74" &&
    GREENFIELD_66_NEXT_AFTER_CLOSE === "#70" &&
    GREENFIELD_66_LIVE_OWNER === "#72"
  );
}

export function greenfield66ProofClassesRemainDistinct(): boolean {
  return new Set(GREENFIELD_66_PROOF_CLASSES).size === GREENFIELD_66_PROOF_CLASSES.length;
}

export function greenfield66ImplementsSibling(_issue: string): boolean {
  return false;
}

export function greenfield66UmbrellaClosesChildren(): boolean {
  return false;
}

export function greenfield66AllowsLiveInThisSlice(): boolean {
  return false;
}

export function greenfield66AllowsU5(): boolean {
  return false;
}

export function greenfield66InventedSecondProofOntology(): boolean {
  return false;
}

export function greenfield66ConsolidatesWorkflows(): boolean {
  return false;
}
