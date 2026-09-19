/**
 * Expo skills/MCP privacy and disclosure boundaries (#87).
 *
 * Screenshot trees, local runtime data, source context, crash reports, and hosted-model
 * access need explicit disclosure. "Local capability" does not mean zero network transfer.
 * Telemetry and feedback are separate external effects — not side effects of reading a skill.
 */
export const EXPO_AGENT_PRIVACY_PATH = "catalog/stacks/expo-agent-privacy.ts" as const;

export type ExpoPrivacySurface =
  "screenshot-tree" | "local-runtime-data" | "source-context" | "crash-report" | "hosted-model-access" | "telemetry" | "public-feedback";

export type ExpoPrivacyDecision =
  | "allow-with-disclosure"
  | "require-synthetic-account"
  | "refuse-secret"
  | "refuse-customer-record"
  | "refuse-zero-network-claim"
  | "refuse-side-effect"
  | "separate-external-effect";

export interface ExpoPrivacyAssessmentInput {
  readonly surface: ExpoPrivacySurface;
  /** True when the path uses Expo MCP service or any hosted model. */
  readonly usesNetworkOrHostedModel?: boolean;
  /** Claim that a "local capability" implies zero network transfer. */
  readonly claimsZeroNetwork?: boolean;
  readonly containsSecret?: boolean;
  readonly containsCustomerRecord?: boolean;
  readonly usesSyntheticAccount?: boolean;
  /** Submitting telemetry/feedback as a side effect of reading a skill or listing tools. */
  readonly sideEffectOfSkillRead?: boolean;
  readonly founderOptInTelemetry?: boolean;
  readonly founderOptInFeedback?: boolean;
}

export interface ExpoPrivacyAssessment {
  readonly decision: ExpoPrivacyDecision;
  readonly surface: ExpoPrivacySurface;
  readonly disclosureRequired: boolean;
  readonly mayLogOrPublish: boolean;
  readonly notes: string;
}

export const EXPO_AGENT_PRIVACY_NOTES = {
  localNotZeroNetwork:
    "Local Expo MCP capability still uses a separately configured package/dev server via the Expo MCP service. Local capability ≠ zero-network.",
  secretsOut: "Secrets and customer records must stay out of logs and public artifacts.",
  syntheticAccounts: "Use synthetic accounts in captures whenever real identity would leak.",
  telemetrySeparate: "Telemetry opt-in/opt-out is a separate external effect — not implied by skill discovery.",
  feedbackSeparate: "Public feedback submission is a separate external effect — not a side effect of reading a skill.",
  screenshotDisclosure: "Screenshot trees require disclosure of what was captured, which app/binary, and retention scope.",
} as const;

export function assessExpoAgentPrivacy(input: ExpoPrivacyAssessmentInput): ExpoPrivacyAssessment {
  if (input.containsSecret) {
    return {
      decision: "refuse-secret",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: false,
      notes: EXPO_AGENT_PRIVACY_NOTES.secretsOut,
    };
  }
  if (input.containsCustomerRecord) {
    return {
      decision: "refuse-customer-record",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: false,
      notes: EXPO_AGENT_PRIVACY_NOTES.secretsOut,
    };
  }
  if (input.claimsZeroNetwork && (input.usesNetworkOrHostedModel || input.surface === "hosted-model-access")) {
    return {
      decision: "refuse-zero-network-claim",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: false,
      notes: EXPO_AGENT_PRIVACY_NOTES.localNotZeroNetwork,
    };
  }
  if (input.surface === "telemetry") {
    if (input.sideEffectOfSkillRead && !input.founderOptInTelemetry) {
      return {
        decision: "refuse-side-effect",
        surface: input.surface,
        disclosureRequired: true,
        mayLogOrPublish: false,
        notes: EXPO_AGENT_PRIVACY_NOTES.telemetrySeparate,
      };
    }
    return {
      decision: "separate-external-effect",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: Boolean(input.founderOptInTelemetry),
      notes: EXPO_AGENT_PRIVACY_NOTES.telemetrySeparate,
    };
  }
  if (input.surface === "public-feedback") {
    if (input.sideEffectOfSkillRead && !input.founderOptInFeedback) {
      return {
        decision: "refuse-side-effect",
        surface: input.surface,
        disclosureRequired: true,
        mayLogOrPublish: false,
        notes: EXPO_AGENT_PRIVACY_NOTES.feedbackSeparate,
      };
    }
    return {
      decision: "separate-external-effect",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: Boolean(input.founderOptInFeedback),
      notes: EXPO_AGENT_PRIVACY_NOTES.feedbackSeparate,
    };
  }
  if ((input.surface === "screenshot-tree" || input.surface === "local-runtime-data" || input.surface === "crash-report") && !input.usesSyntheticAccount) {
    return {
      decision: "require-synthetic-account",
      surface: input.surface,
      disclosureRequired: true,
      mayLogOrPublish: false,
      notes: EXPO_AGENT_PRIVACY_NOTES.syntheticAccounts,
    };
  }
  return {
    decision: "allow-with-disclosure",
    surface: input.surface,
    disclosureRequired: true,
    mayLogOrPublish: true,
    notes:
      input.surface === "screenshot-tree"
        ? EXPO_AGENT_PRIVACY_NOTES.screenshotDisclosure
        : input.usesNetworkOrHostedModel
          ? EXPO_AGENT_PRIVACY_NOTES.localNotZeroNetwork
          : "Disclose retention scope before sharing runtime or source context.",
  };
}
