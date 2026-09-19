/**
 * #88 proof-matrix collection map honesty. Deterministic only.
 * Collect ≠ rebuild. Fixture tiers never promote to live green.
 */
import {
  EXPO_DELIVERY_DISPOSITIONS,
  EXPO_PROOF_CHILD_POINTERS,
  EXPO_PROOF_MATRIX_COLLECTION_ROWS,
  EXPO_PROOF_MATRIX_PATH,
  assertFixtureTierNotPromoted,
  assessCompleteBusinessDisposition,
  collectExpoProofChild,
  listExpoProofHolds,
} from "../../../catalog/stacks/expo-proof-collection.js";
import { existsSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";

export function register(harness: Harness): void {
  harness.check("expo-proof-collection: frozen matrix present; child pointers cover #81–#88", () => {
    const matrixPath = path.join(skillRoot, EXPO_PROOF_MATRIX_PATH);
    assert(existsSync(matrixPath), `${EXPO_PROOF_MATRIX_PATH} must exist`);
    const issues = EXPO_PROOF_CHILD_POINTERS.map((p) => p.issue);
    for (const required of [81, 82, 83, 84, 85, 86, 87, 88] as const) {
      assert(issues.includes(required), `missing child pointer ${required}`);
      const row = collectExpoProofChild(required);
      assert(row.liveHold !== null || required === 81, `${required} should record a live hold or explicit note`);
      assert(row.fixtureSuites.length > 0, `${required} needs fixture suite pointers`);
    }
    assert(EXPO_PROOF_MATRIX_COLLECTION_ROWS.length >= 9, "collection rows cover frozen requirements");
  });

  harness.check("expo-proof-collection: fixture tiers refuse live promotion; holds stay holds", () => {
    const promotion = assertFixtureTierNotPromoted("fixture-tier", true);
    assert(promotion.refused === true, promotion.notes);
    const protocol = assertFixtureTierNotPromoted("protocol", true);
    assert(protocol.refused === true, protocol.notes);
    const ok = assertFixtureTierNotPromoted("fixture-tier", false);
    assert(ok.refused === false, ok.notes);

    const holds = listExpoProofHolds();
    assert(holds.some((h) => h.requirement.includes("Observe")), "Observe stay held");
    assert(holds.some((h) => h.requirement.includes("Upgrade")), "Upgrade workspace stay held");
    assert(holds.some((h) => h.requirement.includes("Complete-business")), "#72 stay held");
    assert(holds.every((h) => h.status === "live-held" || h.status === "blocked" || h.status === "not-run"), "holds not greenwashed");
  });

  harness.check("expo-proof-collection: complete-business dispositions stay distinct; #72 missing = hold", () => {
    assert(EXPO_DELIVERY_DISPOSITIONS.length === 5, "five disposition states");
    const missing = assessCompleteBusinessDisposition({
      hasMatching72Authority: false,
      claimedDisposition: "released",
    });
    assert(missing.held === true && missing.holdReason === "missing-72-authority", missing.notes);
    assert(missing.disposition === null, "no invented disposition");

    const invent = assessCompleteBusinessDisposition({
      hasMatching72Authority: true,
      claimedDisposition: "submitted",
      inventMandateOrWorkspace: true,
    });
    assert(invent.holdReason === "invented-mandate", invent.notes);

    const collapse = assessCompleteBusinessDisposition({
      hasMatching72Authority: true,
      claimedDisposition: "observed",
      collapseStates: true,
    });
    assert(collapse.holdReason === "collapsed-states", collapse.notes);

    const ok = assessCompleteBusinessDisposition({
      hasMatching72Authority: true,
      claimedDisposition: "delivery-accepted",
    });
    assert(ok.accepted === true && ok.disposition === "delivery-accepted", ok.notes);
    assert(ok.distinctStatesRequired.length === 5, "states remain distinct");
  });
}
