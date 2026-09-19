/**
 * Greenfield #71 handoff / stop-lines closeout map (U4-3 residual).
 *
 * Tip AC→evidence ownership for planning→execution handoff + authorized stop
 * lines. Does **not** implement siblings, run a live greenfield benchmark,
 * publish-of-evidence, redo #66/#70, steal #395/#397/#402–#405/#403/#127, build
 * a second planner, flip liveLaunchProven from synthetic, or start U5/#511.
 *
 * Consumes landed surfaces (do not rebuild / do not invent a second planner):
 * - kernel/services/lifecycle.ts
 * - checks/verification/public-api/lifecycle.test.ts
 * - checks/verification/public-api/initialization.test.ts
 * - checks/verification/public-api/recovery.test.ts
 * - checks/verification/public-api/research-decision.test.ts
 * - checks/verification/public-api/business-help.test.ts
 * - checks/verification/fixtures/porchwatch-lifecycle.fixtures.ts
 * - adapters/greenfield/* + greenfield-delivery-audit-* (#66 consume only)
 * - greenfield-70-applicability-closeout-* (#70 consume only)
 *
 * After #71 close: STOP → #73 deepen separate. Live → #72. Independent judgment → #75.
 */
export const GREENFIELD_71_MAP_PATH = "catalog/providers/greenfield-71-handoff-closeout-map.ts" as const;
export const GREENFIELD_71_AUDIT_DOC = "checks/verification/rehearsal/greenfield-71-handoff-closeout.md" as const;
export const GREENFIELD_71_FIXTURE_SUITE = "checks/verification/fixtures/greenfield-71-handoff-closeout.fixtures.ts" as const;
export const LIFECYCLE_PUBLIC_API = "checks/verification/public-api/lifecycle.test.ts" as const;
export const INITIALIZATION_PUBLIC_API = "checks/verification/public-api/initialization.test.ts" as const;
export const RECOVERY_PUBLIC_API = "checks/verification/public-api/recovery.test.ts" as const;
export const RESEARCH_DECISION_PUBLIC_API = "checks/verification/public-api/research-decision.test.ts" as const;
export const BUSINESS_HELP_PUBLIC_API = "checks/verification/public-api/business-help.test.ts" as const;
export const PORCHWATCH_LIFECYCLE_FIXTURE = "checks/verification/fixtures/porchwatch-lifecycle.fixtures.ts" as const;
export const LIFECYCLE_SERVICE = "kernel/services/lifecycle.ts" as const;
export const GREENFIELD_66_AUDIT_DOC = "checks/verification/rehearsal/greenfield-delivery-audit-66.md" as const;
export const GREENFIELD_70_AUDIT_DOC = "checks/verification/rehearsal/greenfield-70-applicability-closeout.md" as const;

export const GREENFIELD_71_BASE_MAIN_SHA = "ad8e2c9d4d7409b044d2d725106c1e9e64ff59e0" as const;
export const GREENFIELD_71_STAMP = "0.221.27" as const;
export const GREENFIELD_71_ISSUE = "#71" as const;

export const GREENFIELD_71_STATUS = ["done", "residual", "held", "sibling"] as const;
export type Greenfield71Status = (typeof GREENFIELD_71_STATUS)[number];

export interface Greenfield71EvidenceRow {
  readonly id: string;
  readonly statement: string;
  readonly tipPath: string;
  readonly fixtureName: string;
  readonly status: Greenfield71Status;
  readonly note: string;
}

/** Original #71 Verification / acceptance checkboxes → tip evidence. */
export const GREENFIELD_71_ACCEPTANCE: readonly Greenfield71EvidenceRow[] = [
  {
    id: "ac-creation-to-first-execution",
    statement: "Creation-to-first-execution and every listed resume boundary have recorded assertions.",
    tipPath: PORCHWATCH_LIFECYCLE_FIXTURE,
    fixtureName:
      "Porchwatch absent-directory + acceptance/init separate + uncertain research; lifecycle create/init/run/recover/replay; init forged-stage; recovery settled-only (composed — no second planner)",
    status: "done",
    note: "Integrated path covered by composing existing public-api + porchwatch suites. Map pins composition.",
  },
  {
    id: "ac-no-duplicate-self-approval-silent-sub",
    statement: "No duplicate registration, direct reducer editing, self-issued approval, or silent scope/provider substitution occurs.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName:
      "public create, accepted initialization and passive planning preserve authority and registration boundaries; forged completed stage…; exact request replay never repeats effects",
    status: "done",
    note: "Registration/authority/replay pins on tip.",
  },
  {
    id: "ac-actionable-next-vs-authority-hold",
    statement: "The public next step is actionable; genuine authority/external holds are distinct from builder failures.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public plan projects distinct hold kinds, ready briefs, and a revision-bound founder question",
    status: "done",
    note: "Hold kinds + ready briefs + founder question distinct.",
  },
  {
    id: "ac-docs-cli-mcp-authority-consistent",
    statement: "Documentation, CLI/MCP results, and signed authority behavior remain consistent.",
    tipPath: BUSINESS_HELP_PUBLIC_API,
    fixtureName: "business plan, run, and evidence help keep delivery distinct from store submission; CLI/MCP catalog refusal envelope parity (#487–#494)",
    status: "done",
    note: "Stop-line help/guide + catalog CLI/MCP parity consumed.",
  },
  {
    id: "ac-pr-fixture-vs-real-agent",
    statement: "The PR states what was tested with fixtures and what was observed with a real agent. Do not close as proof of unattended publication.",
    tipPath: GREENFIELD_71_AUDIT_DOC,
    fixtureName: "greenfield-71-handoff-closeout",
    status: "done",
    note: "This closeout map + PR body. Real-agent observation: not performed (held → #72/#75).",
  },
] as const;

/** Boundary-case table rows from #71 body → tip evidence. */
export const GREENFIELD_71_BOUNDARIES: readonly Greenfield71EvidenceRow[] = [
  {
    id: "bc-target-exists-or-registered",
    statement: "Target exists / ID registered → safe adoption/resume or explicit refusal; no destructive recreation.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public create, accepted initialization and passive planning preserve authority and registration boundaries",
    status: "done",
    note: "One registration; no destructive recreate.",
  },
  {
    id: "bc-research-uncertain-interrupt",
    statement: "Research interrupted with uncertain provider effect → read/reconcile; no automatic repeated paid query.",
    tipPath: PORCHWATCH_LIFECYCLE_FIXTURE,
    fixtureName: "Porchwatch: uncertain research resumes from saved observations without fabricated runtime",
    status: "done",
    note: "needs_reconciliation; no fabricated runtime.",
  },
  {
    id: "bc-stale-revision-after-preview",
    statement: "Product updated after initialization preview → stale revision refused.",
    tipPath: INITIALIZATION_PUBLIC_API,
    fixtureName: "forged completed stage and missing reducer state cannot clear an initialization intent",
    status: "done",
    note: "Revision/intent integrity at init boundaries.",
  },
  {
    id: "bc-accepted-without-work-authority",
    statement: "Product accepted but work authority absent → correct authority hold; no inferred grant.",
    tipPath: PORCHWATCH_LIFECYCLE_FIXTURE,
    fixtureName: "Porchwatch: product acceptance and initialize stay separate",
    status: "done",
    note: "Acceptance ≠ spend/release authority.",
  },
  {
    id: "bc-reuse-valid-authority",
    statement: "Existing valid unchanged authority → reuse; do not re-ask identical question each session.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public run uses existing authority and trusted selected routes; exact request replay never repeats effects",
    status: "done",
    note: "Reuse existing authority on run.",
  },
  {
    id: "bc-revoked-or-candidate-changed",
    statement: "Authority revoked/expired or candidate changed → hold only affected protected work.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public plan projects distinct hold kinds, ready briefs, and a revision-bound founder question",
    status: "done",
    note: "Distinct hold kinds; no global inferred grant.",
  },
  {
    id: "bc-session-ends-remaining-work",
    statement: "Session ends within budget with remaining work → current next permitted step, not whole-business completion.",
    tipPath: BUSINESS_HELP_PUBLIC_API,
    fixtureName: "business guide keeps deliveryAccepted off store submission and live launch; porchwatch deliveryAccepted false under planning",
    status: "done",
    note: "Stop-line + planning completion honesty.",
  },
  {
    id: "bc-request-replay-no-duplicate",
    statement: "Request replay after interrupted execution → no duplicate external effect.",
    tipPath: RECOVERY_PUBLIC_API,
    fixtureName: "public request recovery closes only settled requests without dispatch or proof changes; lifecycle exact request replay",
    status: "done",
    note: "Recovery + replay contracts.",
  },
  {
    id: "bc-one-lane-held-independent-ok",
    statement: "One lane held, independent work permitted → unless accepted policy imposes global prerequisite.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public plan projects distinct hold kinds, ready briefs, and a revision-bound founder question",
    status: "done",
    note: "Independent ready briefs alongside holds.",
  },
  {
    id: "bc-worker-self-approve-refused",
    statement: "Worker tries to approve/sign its own design acceptance → refused by trust boundary.",
    tipPath: INITIALIZATION_PUBLIC_API,
    fixtureName: "forged completed stage and missing reducer state cannot clear an initialization intent",
    status: "done",
    note: "founder-trust-store boundary preserved; no self-clear.",
  },
] as const;

/** Sept 12 catalog refusal matrix (+ CLI/MCP parity) → tip evidence. */
export const GREENFIELD_71_CATALOG_MATRIX: readonly Greenfield71EvidenceRow[] = [
  {
    id: "cat-corrupt",
    statement: "Initialized corrupt catalog → LOCAL_OPERATION_REFUSED / business.catalog_unavailable; state byte-stable.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public initialized planning refuses a corrupt catalog without falling back to fresh planning (#487)",
    status: "done",
    note: "Consume #487; no silent fallback.",
  },
  {
    id: "cat-missing",
    statement: "Initialized missing catalog → same refusal; state byte-stable.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public initialized planning refuses a missing catalog without falling back to fresh planning (#489)",
    status: "done",
    note: "Consume #489.",
  },
  {
    id: "cat-mcp-parity",
    statement: "Local MCP isError envelope matches public/CLI for corrupt+missing.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "local MCP preserves the initialized catalog refusal envelope (#490)",
    status: "done",
    note: "Consume #490.",
  },
  {
    id: "cat-mismatched-pin",
    statement: "Catalog version disagrees with runtime pin → same refusal; planning-only unaffected.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "public initialized planning refuses a catalog whose version disagrees with the runtime pin (#491)",
    status: "done",
    note: "Consume #491.",
  },
  {
    id: "cat-cli-mcp-mismatched-parity",
    statement: "CLI + local MCP mismatched-catalog refusal envelope parity.",
    tipPath: LIFECYCLE_PUBLIC_API,
    fixtureName: "CLI and local MCP preserve the mismatched catalog refusal envelope (#494)",
    status: "done",
    note: "Consume #494.",
  },
] as const;

/** Evidence held to siblings (not residual-in-#71). */
export const GREENFIELD_71_HELD_ROWS: readonly Greenfield71EvidenceRow[] = [
  {
    id: "held-live-complete-business",
    statement: "Live greenfield complete-business benchmark / publish-of-evidence.",
    tipPath: GREENFIELD_71_AUDIT_DOC,
    fixtureName: "hard hold — not performed this slice",
    status: "held",
    note: "Owner #72.",
  },
  {
    id: "held-independent-agent-judgment",
    statement: "Independent live-agent retrieval / judgment evidence.",
    tipPath: GREENFIELD_71_AUDIT_DOC,
    fixtureName: "hard hold — not performed this slice",
    status: "held",
    note: "Owner #75 (coordinate with #72).",
  },
  {
    id: "held-402-405-403-creative-loop",
    statement: "Expanded #402–#405 / #403 creative-refinement loop inside #71.",
    tipPath: GREENFIELD_71_AUDIT_DOC,
    fixtureName: "coordinate-don't-steal pin (HoE Q4 core matrix only)",
    status: "sibling",
    note: "Owners #402–#405 / #403 — not stolen into #71.",
  },
] as const;

/** Coordinate-don't-steal pins (ownership stays with named issues). */
export const GREENFIELD_71_COORDINATE_PINS = ["#395", "#397", "#402", "#403", "#404", "#405", "#127"] as const;

/** U4 remaining after #71. Skip #74 CLOSED. No U5/#511. #72 last. */
export const GREENFIELD_71_U4_REMAINING_SEQUENCE = ["#73", "#75", "#76", "#72"] as const;
export const GREENFIELD_71_SKIP_CLOSED = "#74" as const;
export const GREENFIELD_71_NEXT_AFTER_CLOSE = "#73" as const;
export const GREENFIELD_71_LIVE_OWNER = "#72" as const;
export const GREENFIELD_71_INDEPENDENT_JUDGMENT_OWNER = "#75" as const;
export const GREENFIELD_71_NO_U5 = "#511" as const;

export const GREENFIELD_71_HARD_HOLDS = [
  "live-greenfield-benchmark",
  "publish-of-evidence",
  "live-host-agent-rehearsal",
  "sibling-72-impl",
  "sibling-73-impl",
  "sibling-75-impl",
  "sibling-76-impl",
  "redo-66-umbrella",
  "redo-70-applicability",
  "steal-395-research-pivot",
  "steal-397-research-diagnostics",
  "steal-402-405-post-build",
  "steal-403-ladder",
  "steal-127-wrong-surface",
  "second-planner",
  "hidden-daemon",
  "unbounded-re-dispatch",
  "auto-repin",
  "silent-catalog-fallback",
  "flip-liveLaunchProven-from-synthetic",
  "u5-511",
  "formation",
  "app-review",
  "prices",
  "credentials",
  "paid-tool-install",
  "silent-spend",
  "real-user-registry",
  "real-signing-keys",
  "live-app",
] as const;

export const GREENFIELD_71_SEQUENCE_LOCK_NOTE =
  "#73 → #75 → #76 → #72 last; skip #74 CLOSED; no U5/#511; live+publish → #72; independent judgment → #75; after #71 STOP → #73 deepen separate." as const;

export const GREENFIELD_71_HANDOFF_NOTE =
  "Handoff is the supported public lifecycle route (create → plan → research reconcile → accept → initialize → first authorized run → recover/resume), not a second planner." as const;

export const GREENFIELD_71_STOP_LINE_NOTE =
  "completion.deliveryAccepted = closeout evidence ≠ store submission/release; liveLaunchProven stays false without provider-native proof + separately granted authority." as const;

export function getGreenfield71Acceptance(): readonly Greenfield71EvidenceRow[] {
  return GREENFIELD_71_ACCEPTANCE;
}

export function getGreenfield71Boundaries(): readonly Greenfield71EvidenceRow[] {
  return GREENFIELD_71_BOUNDARIES;
}

export function getGreenfield71CatalogMatrix(): readonly Greenfield71EvidenceRow[] {
  return GREENFIELD_71_CATALOG_MATRIX;
}

export function getGreenfield71HeldRows(): readonly Greenfield71EvidenceRow[] {
  return GREENFIELD_71_HELD_ROWS;
}

export function greenfield71AllAcceptanceDone(): boolean {
  return GREENFIELD_71_ACCEPTANCE.every((row) => row.status === "done");
}

export function greenfield71AllBoundariesDone(): boolean {
  return GREENFIELD_71_BOUNDARIES.every((row) => row.status === "done");
}

export function greenfield71AllCatalogMatrixDone(): boolean {
  return GREENFIELD_71_CATALOG_MATRIX.every((row) => row.status === "done");
}

export function greenfield71AllowsLiveInThisSlice(): boolean {
  return false;
}

export function greenfield71AllowsU5(): boolean {
  return false;
}

export function greenfield71BuildsSecondPlanner(): boolean {
  return false;
}

export function greenfield71FlipsLiveLaunchProvenFromSynthetic(): boolean {
  return false;
}

export function greenfield71Redoes66Umbrella(): boolean {
  return false;
}

export function greenfield71Redoes70Applicability(): boolean {
  return false;
}

export function greenfield71Steals403Ladder(): boolean {
  return false;
}

export function greenfield71StealsCoordinatePins(): boolean {
  return false;
}

export function greenfield71SequenceIsLocked(): boolean {
  return (
    GREENFIELD_71_U4_REMAINING_SEQUENCE.length === 4 &&
    GREENFIELD_71_U4_REMAINING_SEQUENCE[0] === "#73" &&
    GREENFIELD_71_U4_REMAINING_SEQUENCE[3] === "#72" &&
    GREENFIELD_71_SKIP_CLOSED === "#74" &&
    GREENFIELD_71_NEXT_AFTER_CLOSE === "#73" &&
    GREENFIELD_71_LIVE_OWNER === "#72" &&
    GREENFIELD_71_INDEPENDENT_JUDGMENT_OWNER === "#75"
  );
}
