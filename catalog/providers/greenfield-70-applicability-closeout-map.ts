/**
 * Greenfield #70 applicability closeout map (U4-2 residual).
 *
 * Tip AC→evidence ownership for surface-technique applicability. Does **not**
 * implement siblings, run a live greenfield benchmark, redo #66, reopen #108,
 * steal #403 ladder/preview/delivery, or start U5/#511.
 *
 * Consumes landed surfaces (do not rebuild / do not invent a second ontology):
 * - catalog/ontology/design-surface-applicability.ts
 * - checks/validation/business/design/surface-page-gates.ts
 * - checks/verification/fixtures/design-surface-applicability.fixtures.ts
 * - examples/mixed-surfaces/ (Quiet Receipt)
 * - catalog/workflows/growth-revenue.ts (#470 quality bar)
 * - adapters/greenfield/* + greenfield-delivery-audit-* (#66 consume only)
 *
 * After #70 close: STOP → #71 deepen separate. Live → #72.
 */
export const GREENFIELD_70_MAP_PATH = "catalog/providers/greenfield-70-applicability-closeout-map.ts" as const;
export const GREENFIELD_70_AUDIT_DOC = "checks/verification/rehearsal/greenfield-70-applicability-closeout.md" as const;
export const GREENFIELD_70_FIXTURE_SUITE = "checks/verification/fixtures/greenfield-70-applicability-closeout.fixtures.ts" as const;
export const DESIGN_SURFACE_APPLICABILITY_FIXTURE = "checks/verification/fixtures/design-surface-applicability.fixtures.ts" as const;
export const DESIGN_SURFACE_APPLICABILITY_ONTOLOGY = "catalog/ontology/design-surface-applicability.ts" as const;
export const SURFACE_PAGE_GATES = "checks/validation/business/design/surface-page-gates.ts" as const;
export const MIXED_SURFACE_FINDING = "examples/mixed-surfaces/business/design/reviews/MIXED_SURFACE_INDEPENDENT_REVIEW.md" as const;
export const MIXED_SURFACE_PRIVACY = "examples/mixed-surfaces/business/growth/landing/privacy.html" as const;
export const MIXED_SURFACE_CONVERSION = "examples/mixed-surfaces/business/growth/landing/conversion.html" as const;
export const MIXED_SURFACE_CINEMATIC = "examples/mixed-surfaces/business/growth/landing/cinematic.html" as const;
export const GROWTH_REVENUE_PRODUCER = "catalog/workflows/growth-revenue.ts" as const;
export const GREENFIELD_66_AUDIT_DOC = "checks/verification/rehearsal/greenfield-delivery-audit-66.md" as const;

export const GREENFIELD_70_BASE_MAIN_SHA = "d00ebd80066d75cd13998efe963743d15b8316ff" as const;
export const GREENFIELD_70_STAMP = "0.221.26" as const;
export const GREENFIELD_70_ISSUE = "#70" as const;

export const GREENFIELD_70_STATUS = ["done", "residual", "held", "sibling"] as const;
export type Greenfield70Status = (typeof GREENFIELD_70_STATUS)[number];

export interface Greenfield70EvidenceRow {
  readonly id: string;
  readonly statement: string;
  readonly tipPath: string;
  readonly fixtureName: string;
  readonly status: Greenfield70Status;
  readonly note: string;
}

/** Original #70 Verification checkboxes → tip evidence. */
export const GREENFIELD_70_ACCEPTANCE: readonly Greenfield70EvidenceRow[] = [
  {
    id: "ac-matrix-fixtures",
    statement: "Each row of the matrix has a fixture or an explicit reviewed applicability test.",
    tipPath: DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
    fixtureName: "design-surface-applicability (full suite)",
    status: "done",
    note: "29 harness checks cover matrix distinctions.",
  },
  {
    id: "ac-static-not-forced",
    statement: "Static pages are not forced to create pointless animations or conversion goals.",
    tipPath: SURFACE_PAGE_GATES,
    fixtureName: "page-gates: static privacy without invented CRO passes; static_document_invented_scrollytelling fails…",
    status: "done",
    note: "Invented scrollytelling on privacy fails; residual guidance refuses universal procedure.",
  },
  {
    id: "ac-rich-cannot-bypass",
    statement: "Selected/implemented rich interactions cannot bypass their behavior/accessibility/performance obligations.",
    tipPath: DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
    fixtureName: "selected scrollytelling requires 60fps; implemented hooks; cinematic conversion CRO fail",
    status: "done",
    note: "Selected/implemented motion keeps obligations.",
  },
  {
    id: "ac-provider-no-silent",
    statement: "Provider availability never silently changes founder selection or authorizes spend.",
    tipPath: DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
    fixtureName: "bespoke motion with a blocked 60fps route is unavailable; residual guidance distilled-recipe refuse",
    status: "done",
    note: "Unavailable hold; distilled-recipe fallback not equivalent.",
  },
  {
    id: "ac-producer-rubric-agree",
    statement: "Producer instructions, reference delivery, deterministic checks, and independent rubric agree.",
    tipPath: MIXED_SURFACE_FINDING,
    fixtureName: "mixed live fixture finding artifact…; residual guidance pins; greenfield-70 finding reconcile",
    status: "done",
    note: "Finding re-scored 2026-09-19; stale leftovers cleared.",
  },
  {
    id: "ac-scope-invalidate-affected",
    statement: "Approved scope changes invalidate only affected acceptance, with history preserved.",
    tipPath: "catalog/workflows/product-experience.ts",
    fixtureName: "live ONB-08 consult reopen (landed #120 wave)",
    status: "done",
    note: "Consult invalidation landed; do not silently reopen unrelated outputs.",
  },
  {
    id: "ac-pr-obligation-map",
    statement: "PR includes the before/after obligation map, test evidence, and any policy decision required.",
    tipPath: GREENFIELD_70_AUDIT_DOC,
    fixtureName: "greenfield-70-applicability-closeout",
    status: "done",
    note: "This closeout map + PR body.",
  },
] as const;

/** Working applicability matrix rows → tip evidence. */
export const GREENFIELD_70_MATRIX: readonly Greenfield70EvidenceRow[] = [
  {
    id: "mx-static-legal",
    statement: "Static legal/support page — semantic/a11y/accurate claims; not scroll/CRO invent.",
    tipPath: MIXED_SURFACE_PRIVACY,
    fixtureName: "static legal page; static privacy passes; invented-scrollytelling fails; mixed live",
    status: "done",
    note: "Quiet Receipt privacy is static-document.",
  },
  {
    id: "mx-conversion-no-scroll",
    statement: "Conversion landing without scroll-linked behavior — CTA flow; not invented scrollytelling.",
    tipPath: MIXED_SURFACE_CONVERSION,
    fixtureName: "conversion without 60fps; conversion without CRO fails; mixed live",
    status: "done",
    note: "Quiet Receipt waitlist is conversion.",
  },
  {
    id: "mx-scrollytelling",
    statement: "Selected or implemented scrollytelling — full motion/a11y/performance obligations.",
    tipPath: MIXED_SURFACE_CINEMATIC,
    fixtureName: "selected scrollytelling; implemented hooks; cinematic conversion CRO; mixed live",
    status: "done",
    note: "Quiet Receipt cinematic is scroll-linked.",
  },
  {
    id: "mx-native-transitions",
    statement: "Native UI using standard transitions — usable feedback; not bespoke paid catalog.",
    tipPath: DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
    fixtureName: "native standard transitions do not select a paid motion catalog",
    status: "done",
    note: "Matrix row covered by ontology fixture.",
  },
  {
    id: "mx-bespoke-motion",
    statement: "Bespoke motion — reference/rationale + reduced-motion + measured performance.",
    tipPath: DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
    fixtureName: "bespoke motion with a blocked 60fps route is unavailable",
    status: "done",
    note: "Unavailable when 60fps route blocked.",
  },
  {
    id: "mx-provider-unavailable",
    statement: "Explicitly required reference provider unavailable — precise hold; no unlabeled equivalent.",
    tipPath: "knowledge/design/design-evidence-stack.md",
    fixtureName: "unavailable hold; residual guidance refuses distilled-recipe fallback",
    status: "done",
    note: "Hold ≠ silent spend/fallback.",
  },
] as const;

export const GREENFIELD_70_CLEARED_LEFTOVERS = [
  "privacy-copy-drift-stores-vs-does-not-store",
  "nav-targets-below-24px",
  "cinematic-48px-plate-figcaption-overlap",
] as const;
export type Greenfield70ClearedLeftover = (typeof GREENFIELD_70_CLEARED_LEFTOVERS)[number];

/** U4 remaining after #70. Skip #74 CLOSED. No U5/#511. #72 last. */
export const GREENFIELD_70_U4_REMAINING_SEQUENCE = ["#71", "#73", "#75", "#76", "#72"] as const;
export const GREENFIELD_70_SKIP_CLOSED = "#74" as const;
export const GREENFIELD_70_NEXT_AFTER_CLOSE = "#71" as const;
export const GREENFIELD_70_LIVE_OWNER = "#72" as const;
export const GREENFIELD_70_QUALITY_COORDINATE = "#403" as const;
export const GREENFIELD_70_NO_U5 = "#511" as const;

export const GREENFIELD_70_HARD_HOLDS = [
  "live-greenfield-benchmark",
  "publish-of-evidence",
  "sibling-71",
  "sibling-73",
  "sibling-75",
  "sibling-76",
  "sibling-72-impl",
  "redo-66-umbrella",
  "reopen-108",
  "steal-403-ladder",
  "u5-511",
  "formation",
  "app-review",
  "prices",
  "credentials",
  "paid-tool-install",
  "silent-spend-fallback",
  "second-applicability-store",
  "infer-technique-from-purpose-prose",
] as const;

export const GREENFIELD_70_SEQUENCE_LOCK_NOTE =
  "#71 → #73 → #75 → #76 → #72 last; skip #74 CLOSED; no U5/#511; live+publish → #72; after #70 STOP → #71 deepen separate." as const;

export const GREENFIELD_70_QUALITY_BOUNDARY_NOTE =
  "Quality bar retained when technique N/A (consume #470). #70 does not own #403 11-star ladder/preview/delivery." as const;

export function getGreenfield70Acceptance(): readonly Greenfield70EvidenceRow[] {
  return GREENFIELD_70_ACCEPTANCE;
}

export function getGreenfield70Matrix(): readonly Greenfield70EvidenceRow[] {
  return GREENFIELD_70_MATRIX;
}

export function greenfield70AllAcceptanceDone(): boolean {
  return GREENFIELD_70_ACCEPTANCE.every((row) => row.status === "done");
}

export function greenfield70AllMatrixDone(): boolean {
  return GREENFIELD_70_MATRIX.every((row) => row.status === "done");
}

export function greenfield70AllowsLiveInThisSlice(): boolean {
  return false;
}

export function greenfield70AllowsU5(): boolean {
  return false;
}

export function greenfield70Steals403Ladder(): boolean {
  return false;
}

export function greenfield70Redoes66Umbrella(): boolean {
  return false;
}

export function greenfield70SequenceIsLocked(): boolean {
  return (
    GREENFIELD_70_U4_REMAINING_SEQUENCE.length === 5 &&
    GREENFIELD_70_U4_REMAINING_SEQUENCE[0] === "#71" &&
    GREENFIELD_70_U4_REMAINING_SEQUENCE[4] === "#72" &&
    GREENFIELD_70_SKIP_CLOSED === "#74" &&
    GREENFIELD_70_NEXT_AFTER_CLOSE === "#71" &&
    GREENFIELD_70_LIVE_OWNER === "#72"
  );
}
