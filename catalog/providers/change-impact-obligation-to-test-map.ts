/**
 * #525 SQ-13 — AC→evidence map for semantic change-impact / obligation-to-test.
 *
 * Consumes #519+#521+#520+#522+#523. Coordinates #74/#76/#403 (consume #76;
 * do not replace). Does not redo #512–#524. NO_527_IMPL cleared by #527. NO_528_IMPL cleared by #528. NO_529_IMPL cleared by #529. Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. No second obligation ledger. No semantic
 * waiver of gates. No device proof generation. No auto-accepted scope.
 */
export const CHANGE_IMPACT_OBLIGATION_MAP_PATH = "catalog/providers/change-impact-obligation-to-test-map.ts" as const;
export const CHANGE_IMPACT_OBLIGATION_SERVICE_MODULE = "kernel/services/change-impact-obligation-to-test.ts" as const;
export const CHANGE_IMPACT_OBLIGATION_RECIPE_MODULE = "catalog/workflows/change-impact-obligation-to-test.ts" as const;
export const CHANGE_IMPACT_OBLIGATION_FIXTURE = "checks/verification/fixtures/change-impact-obligation-to-test.fixtures.ts" as const;
export const BUSINESS_CHANGE_IMPACT_FIXTURE = "checks/verification/fixtures/business-change-impact.fixtures.ts" as const;
export const GREENFIELD_76_MAP = "catalog/providers/greenfield-76-change-impact-closeout-map.ts" as const;
export const OPERATING_SYSTEM_WORKFLOWS = "catalog/workflows/operating-system.ts" as const;
export const RUNSTATE = "kernel/engine/runstate.ts" as const;
export const SOURCE_FINGERPRINT = "kernel/engine/source-fingerprint.ts" as const;

export const CHANGE_IMPACT_OBLIGATION_ISSUE = "#525" as const;
export const CHANGE_IMPACT_OBLIGATION_EPIC = "#511" as const;
export const CHANGE_IMPACT_OBLIGATION_PLANNING_ID = "SQ-13" as const;
export const CHANGE_IMPACT_OBLIGATION_CONSUMES = ["#519", "#521", "#520", "#522", "#523"] as const;
export const CHANGE_IMPACT_OBLIGATION_COORDINATES = ["#74", "#76", "#403"] as const;
export const CHANGE_IMPACT_OBLIGATION_STAMP = "0.221.46" as const;
export const CHANGE_IMPACT_OBLIGATION_BASE_MAIN_SHA = "2a16e48bced0abb0143ae94aea59a4dd9db3966f" as const;
export const CHANGE_IMPACT_OBLIGATION_LIVE_NOT_PERFORMED = true as const;
export const CHANGE_IMPACT_OBLIGATION_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const CHANGE_IMPACT_OBLIGATION_IOS_SIM_OOS = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_NETWORK = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_SECOND_LEDGER = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_REPLACE_76 = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_SEMANTIC_WAIVER = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_DEVICE_PROOF = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_AUTO_ACCEPT_SCOPE = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_SYNTHETIC_AS_DEVICE = true as const;
export const CHANGE_IMPACT_OBLIGATION_NO_525_IMPL = false as const;
export const CHANGE_IMPACT_OBLIGATION_NEXT_AFTER_CLOSE = "#511" as const;

export const CHANGE_IMPACT_OBLIGATION_AC = [
  {
    id: "ac1-invalidating-change-affected-retain-unrelated",
    acceptance: "A change that invalidates a product promise identifies the affected dependent surfaces while retaining an unrelated valid feature.",
    evidence: `${CHANGE_IMPACT_OBLIGATION_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-source-exists-but-unsupported-not-coverage",
    acceptance: "A source that exists but does not support the claimed obligation is not counted as coverage.",
    evidence: `${CHANGE_IMPACT_OBLIGATION_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-no-semantic-score-waives-invalidation",
    acceptance: "No added semantic score can exempt changed source from required acceptance invalidation.",
    evidence: `${CHANGE_IMPACT_OBLIGATION_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-proposed-test-not-passed-until-evidence",
    acceptance: "A proposed test has not passed until its actual accepted evidence arrives; incomplete test coverage remains explicit.",
    evidence: `${CHANGE_IMPACT_OBLIGATION_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-repeat-interrupt-cascade-ids-stable",
    acceptance: "Repeated change events and interrupted repair use current cascade/recovery identities without duplicate effects.",
    evidence: `${CHANGE_IMPACT_OBLIGATION_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function changeImpactObligationAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return CHANGE_IMPACT_OBLIGATION_AC;
}
