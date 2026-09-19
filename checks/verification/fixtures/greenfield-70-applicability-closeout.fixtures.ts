/**
 * #70 applicability closeout fixtures (U4-2 residual).
 *
 * Deterministic only. Quiet Receipt finding re-score is fixture-tier — not
 * live greenfield / publish-of-evidence (#72). Does not redo #66, reopen #108,
 * steal #403 ladder, or implement siblings.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  DESIGN_SURFACE_APPLICABILITY_FIXTURE,
  DESIGN_SURFACE_APPLICABILITY_ONTOLOGY,
  GREENFIELD_66_AUDIT_DOC,
  GREENFIELD_70_ACCEPTANCE,
  GREENFIELD_70_AUDIT_DOC,
  GREENFIELD_70_BASE_MAIN_SHA,
  GREENFIELD_70_CLEARED_LEFTOVERS,
  GREENFIELD_70_FIXTURE_SUITE,
  GREENFIELD_70_HARD_HOLDS,
  GREENFIELD_70_LIVE_OWNER,
  GREENFIELD_70_MAP_PATH,
  GREENFIELD_70_MATRIX,
  GREENFIELD_70_NEXT_AFTER_CLOSE,
  GREENFIELD_70_NO_U5,
  GREENFIELD_70_QUALITY_BOUNDARY_NOTE,
  GREENFIELD_70_QUALITY_COORDINATE,
  GREENFIELD_70_SEQUENCE_LOCK_NOTE,
  GREENFIELD_70_SKIP_CLOSED,
  GREENFIELD_70_STAMP,
  GREENFIELD_70_U4_REMAINING_SEQUENCE,
  GROWTH_REVENUE_PRODUCER,
  MIXED_SURFACE_CINEMATIC,
  MIXED_SURFACE_CONVERSION,
  MIXED_SURFACE_FINDING,
  MIXED_SURFACE_PRIVACY,
  SURFACE_PAGE_GATES,
  getGreenfield70Acceptance,
  getGreenfield70Matrix,
  greenfield70AllAcceptanceDone,
  greenfield70AllMatrixDone,
  greenfield70AllowsLiveInThisSlice,
  greenfield70AllowsU5,
  greenfield70Redoes66Umbrella,
  greenfield70SequenceIsLocked,
  greenfield70Steals403Ladder,
} from "../../../catalog/providers/greenfield-70-applicability-closeout-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const AUDIT_DOC = path.join(skillRoot, GREENFIELD_70_AUDIT_DOC);
const MAP_FILE = path.join(skillRoot, GREENFIELD_70_MAP_PATH);
const FINDING = path.join(skillRoot, MIXED_SURFACE_FINDING);
const PRIVACY = path.join(skillRoot, MIXED_SURFACE_PRIVACY);
const CONVERSION = path.join(skillRoot, MIXED_SURFACE_CONVERSION);
const CINEMATIC = path.join(skillRoot, MIXED_SURFACE_CINEMATIC);
const DSA = path.join(skillRoot, DESIGN_SURFACE_APPLICABILITY_FIXTURE);
const ONTOLOGY = path.join(skillRoot, DESIGN_SURFACE_APPLICABILITY_ONTOLOGY);
const PAGE_GATES = path.join(skillRoot, SURFACE_PAGE_GATES);
const GROWTH = path.join(skillRoot, GROWTH_REVENUE_PRODUCER);
const GF66 = path.join(skillRoot, GREENFIELD_66_AUDIT_DOC);

export function register(harness: Harness): void {
  harness.check("greenfield-70: AC→evidence map covers all acceptance + matrix rows as done", () => {
    assert(existsSync(MAP_FILE), "typed map present");
    assert(existsSync(AUDIT_DOC), "rehearsal doc present");
    assert(getGreenfield70Acceptance() === GREENFIELD_70_ACCEPTANCE, "acceptance getter");
    assert(getGreenfield70Matrix() === GREENFIELD_70_MATRIX, "matrix getter");
    assert(GREENFIELD_70_ACCEPTANCE.length === 7, "seven acceptance rows");
    assert(GREENFIELD_70_MATRIX.length === 6, "six matrix rows");
    assert(greenfield70AllAcceptanceDone(), "all acceptance done");
    assert(greenfield70AllMatrixDone(), "all matrix done");
    for (const row of [...GREENFIELD_70_ACCEPTANCE, ...GREENFIELD_70_MATRIX]) {
      assert(row.status === "done", `${row.id} must be done`);
      assert(row.tipPath.length > 0, `${row.id} tip path`);
      assert(row.fixtureName.length > 0, `${row.id} fixture`);
    }
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(/AC→evidence|acceptance → evidence/i.test(audit), "audit names AC map");
    assert(/#403 boundary/i.test(audit), "audit names #403 boundary");
    assert(audit.includes(GREENFIELD_70_BASE_MAIN_SHA), "audit pins base SHA");
    assert(audit.includes(GREENFIELD_70_STAMP), "audit pins stamp");
  });

  harness.check("greenfield-70: Quiet Receipt tip HTML repairs + finding re-score clear stale leftovers", () => {
    assert(existsSync(FINDING), "finding present");
    assert(existsSync(PRIVACY) && existsSync(CONVERSION) && existsSync(CINEMATIC), "Quiet Receipt HTML");
    const review = readFileSync(FINDING, "utf8");
    const privacy = readFileSync(PRIVACY, "utf8");
    const conversion = readFileSync(CONVERSION, "utf8");
    const cinematic = readFileSync(CINEMATIC, "utf8");

    assert(/\bStatus:\s*\*\*filled\*\*/.test(review), "finding filled");
    const verdict = review.split("## Verdict")[1] ?? "";
    assert(/^\s*pass\b/m.test(verdict), "verdict pass");
    assert(/fixture-tier/i.test(review), "fixture-tier honesty");
    assert(/file-based independent review|File-based independent review/i.test(review), "method documented");
    assert(!/\bAccept increment\b/.test(review), "no accept-increment prose");

    // Tip HTML repairs (8a49788+)
    assert(/does not store the email you submit/.test(privacy), "privacy tip: does not store");
    assert(/min-height:\s*24px/.test(privacy) && /min-width:\s*24px/.test(privacy), "privacy nav 24px");
    assert(/min-height:\s*24px/.test(conversion) && /min-width:\s*24px/.test(conversion), "conversion nav 24px");
    assert(/min-height:\s*24px/.test(cinematic) && /min-width:\s*24px/.test(cinematic), "cinematic nav 24px");
    assert(/did not\s+store it/.test(conversion), "conversion confirmation: did not store");
    assert(
      /\[data-scene-lifecycle="active"\] \[data-scene-visual\] p\s*\{\s*display:\s*none/.test(cinematic),
      "cinematic active plate labels hidden",
    );
    assert(/figcaption\s*\{[^}]*z-index:\s*1/s.test(cinematic), "cinematic figcaption z-index");
    assert(/min-height:\s*16\.5rem/.test(cinematic), "cinematic active stage height");

    // Finding must not re-assert stale leftovers
    assert(!/stores the submitted address/.test(review), "finding must not claim privacy stores leftover");
    assert(!/remain 19px tall/.test(review), "finding must not claim 19px nav leftover");
    assert(!/overflows the stage by 48px/.test(review), "finding must not claim 48px plate leftover");
    assert(!/48px plate and\s+figcaption overlap/.test(review), "finding must not retain 48px verdict leftover");
    assert(/cleared/i.test(review), "finding records cleared leftovers");
    assert(GREENFIELD_70_CLEARED_LEFTOVERS.length === 3, "three cleared leftovers named");
  });

  harness.check("greenfield-70: sequence lock #71→#73→#75→#76→#72; next=#71; live=#72; no U5", () => {
    assert(greenfield70SequenceIsLocked(), "sequence locked");
    assert(
      JSON.stringify([...GREENFIELD_70_U4_REMAINING_SEQUENCE]) === JSON.stringify(["#71", "#73", "#75", "#76", "#72"]),
      "exact remaining order",
    );
    assert(GREENFIELD_70_SKIP_CLOSED === "#74", "skip #74");
    assert(GREENFIELD_70_NEXT_AFTER_CLOSE === "#71", "next after close");
    assert(GREENFIELD_70_LIVE_OWNER === "#72", "live owner");
    assert(GREENFIELD_70_NO_U5 === "#511", "no U5");
    assert(GREENFIELD_70_SEQUENCE_LOCK_NOTE.includes("#71"), "lock note");
    assert(greenfield70AllowsLiveInThisSlice() === false, "no live in #70");
    assert(greenfield70AllowsU5() === false, "no U5");
    assert(GREENFIELD_70_HARD_HOLDS.includes("live-greenfield-benchmark"), "live hold");
    assert(GREENFIELD_70_HARD_HOLDS.includes("publish-of-evidence"), "publish hold");
    assert(GREENFIELD_70_HARD_HOLDS.includes("sibling-71"), "sibling hold");
  });

  harness.check("greenfield-70: #403 quality boundary retained; ladder not stolen; #66 consume only", () => {
    assert(GREENFIELD_70_QUALITY_COORDINATE === "#403", "coordinate #403");
    assert(greenfield70Steals403Ladder() === false, "do not steal ladder");
    assert(/Quality bar retained/.test(GREENFIELD_70_QUALITY_BOUNDARY_NOTE), "quality bar note");
    assert(greenfield70Redoes66Umbrella() === false, "do not redo #66");
    assert(existsSync(GF66), "#66 rehearsal present to consume");
    assert(existsSync(DSA) && existsSync(ONTOLOGY) && existsSync(PAGE_GATES), "DSA surfaces present");
    assert(existsSync(GROWTH), "growth producer present");
    const growth = readFileSync(GROWTH, "utf8");
    assert(
      /static-document and conventional conversion surfaces, keep the quality bar on semantic content, legibility, accessibility, responsive behavior, and truthful claims/s.test(
        growth,
      ),
      "quality bar wording retained in producer",
    );
    const audit = readFileSync(AUDIT_DOC, "utf8");
    assert(audit.includes("#403"), "audit coordinates #403");
    assert(/does not own/i.test(audit) || /ladder not stolen/i.test(audit) || /#70 does not own/.test(audit), "#403 not stolen");
    assert(existsSync(path.join(skillRoot, GREENFIELD_70_FIXTURE_SUITE)), "closeout suite path");
  });
}
