/**
 * #529 SQ-17 — AC→evidence map for bounded AI-powered product components with
 * tested fallback behavior.
 *
 * Consumes #512+#515+#516+#518+#520+#523. Does not redo #512–#528.
 * Does not implement #511 closeout or #573.
 * Paper / synthetic fixtures only. Not a chatbot. No unconstrained tool
 * execution. No model-emitted code or privileged tool call. No runtime-generated
 * UI. No client-side credential. No on-device TypeSafe claim. No distillation.
 * No unapproved customer-data transfer. No invented constraints — an ambiguous
 * time or equipment mention becomes a question, never a fact. Confidence is not
 * authorization. No runtime TypeSafe call into TUCK or any existing offline
 * business without an explicit scope decision.
 */
export const BOUNDED_AI_COMPONENTS_MAP_PATH = "catalog/providers/bounded-ai-product-components-map.ts" as const;
export const BOUNDED_AI_COMPONENTS_SERVICE_MODULE = "kernel/services/bounded-ai-product-components.ts" as const;
export const BOUNDED_AI_COMPONENTS_RECIPE_MODULE = "catalog/workflows/bounded-ai-product-components.ts" as const;
export const BOUNDED_AI_COMPONENTS_FIXTURE = "checks/verification/fixtures/bounded-ai-product-components.fixtures.ts" as const;
export const QUESTION_PACK_CONTRACT = "contracts/semantic/question-pack.ts" as const;
export const SEMANTIC_QUESTIONS_CONTRACT = "contracts/semantic/questions.ts" as const;
export const SEMANTIC_RUNTIME_SAFETY_OWNER = "kernel/services/semantic-runtime-safety.ts" as const;
export const INFERENCE_RECEIPT_OWNER = "kernel/services/inference-receipt-store.ts" as const;

export const BOUNDED_AI_COMPONENTS_ISSUE = "#529" as const;
export const BOUNDED_AI_COMPONENTS_EPIC = "#511" as const;
export const BOUNDED_AI_COMPONENTS_PLANNING_ID = "SQ-17" as const;
export const BOUNDED_AI_COMPONENTS_CONSUMES = ["#512", "#515", "#516", "#518", "#520", "#523"] as const;
export const BOUNDED_AI_COMPONENTS_STAMP = "0.221.50" as const;
export const BOUNDED_AI_COMPONENTS_BASE_MAIN_SHA = "be93b972b60a2fd2cefce979146c0ff9406d94f8" as const;
export const BOUNDED_AI_COMPONENTS_LIVE_NOT_PERFORMED = true as const;
export const BOUNDED_AI_COMPONENTS_HOSTED_KEY_OWNER = "CoS→Eduardo" as const;
export const BOUNDED_AI_COMPONENTS_NO_NETWORK = true as const;
export const BOUNDED_AI_COMPONENTS_NO_CHATBOT = true as const;
export const BOUNDED_AI_COMPONENTS_NO_UNCONSTRAINED_TOOLS = true as const;
export const BOUNDED_AI_COMPONENTS_NO_MODEL_EMITTED_CODE = true as const;
export const BOUNDED_AI_COMPONENTS_NO_RUNTIME_GENERATED_UI = true as const;
export const BOUNDED_AI_COMPONENTS_NO_CLIENT_API_KEY = true as const;
export const BOUNDED_AI_COMPONENTS_NO_ON_DEVICE_TYPESAFE_CLAIM = true as const;
export const BOUNDED_AI_COMPONENTS_NO_DISTILLATION = true as const;
export const BOUNDED_AI_COMPONENTS_NO_UNAPPROVED_DATA_TRANSFER = true as const;
export const BOUNDED_AI_COMPONENTS_NO_INVENTED_CONSTRAINTS = true as const;
export const BOUNDED_AI_COMPONENTS_NO_TUCK_RUNTIME_TYPESAFE = true as const;
export const BOUNDED_AI_COMPONENTS_CONFIDENCE_IS_NOT_AUTHORIZATION = true as const;
export const BOUNDED_AI_COMPONENTS_AMBIGUITY_IS_NOT_A_FACT = true as const;
export const BOUNDED_AI_COMPONENTS_OUTAGE_STAYS_USEFUL = true as const;
export const BOUNDED_AI_COMPONENTS_NO_529_IMPL = false as const;
export const BOUNDED_AI_COMPONENTS_NEXT_AFTER_CLOSE = "#511" as const;

export const BOUNDED_AI_COMPONENTS_AC = [
  {
    id: "ac1-unsafe-action-rejected-despite-confidence",
    acceptance: "An unrecognized or unsafe action is rejected even when the semantic result confidently requests it.",
    evidence: `${BOUNDED_AI_COMPONENTS_FIXTURE} :: AC1`,
    covered: true as const,
  },
  {
    id: "ac2-outage-keeps-useful-flow-no-client-secret",
    acceptance: "A service outage leaves a useful deterministic flow and no secret in the shipped client.",
    evidence: `${BOUNDED_AI_COMPONENTS_FIXTURE} :: AC2`,
    covered: true as const,
  },
  {
    id: "ac3-interpretation-inspectable-correctable-no-fabrication",
    acceptance: "The user can inspect and correct a material interpretation; ambiguous time or equipment constraints do not become fabricated facts.",
    evidence: `${BOUNDED_AI_COMPONENTS_FIXTURE} :: AC3`,
    covered: true as const,
  },
  {
    id: "ac4-tests-prove-bounded-control-flow-and-permitted-actions",
    acceptance: "Tests prove bounded control flow and the actual permitted actions, not just JSON validity.",
    evidence: `${BOUNDED_AI_COMPONENTS_FIXTURE} :: AC4`,
    covered: true as const,
  },
  {
    id: "ac5-no-runtime-typesafe-in-tuck-or-offline-business",
    acceptance: "No runtime TypeSafe call is added to TUCK or any existing offline business without an explicit scope decision.",
    evidence: `${BOUNDED_AI_COMPONENTS_FIXTURE} :: AC5`,
    covered: true as const,
  },
] as const;

export function boundedAiComponentsAcEvidence(): readonly {
  id: string;
  acceptance: string;
  evidence: string;
  covered: boolean;
}[] {
  return BOUNDED_AI_COMPONENTS_AC;
}
