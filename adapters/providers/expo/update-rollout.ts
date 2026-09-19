/**
 * EAS Update rollout model + health-hold (#85).
 *
 * Percentage advance holds when health is missing or ambiguous. Unknown ≠ healthy.
 * No invented user counts or numeric adoption thresholds. Models + fixtures only.
 */

export const EXPO_UPDATE_ROLLOUT_PATH = "adapters/providers/expo/update-rollout.ts" as const;

export type ExpoUpdateHealthSignal = "healthy" | "unhealthy" | "unknown" | "missing";

export type ExpoUpdateRolloutAction = "hold" | "advance" | "stop-rollout";

export type ExpoUpdateRolloutHoldReason =
  | "health-unknown"
  | "health-missing"
  | "health-unhealthy"
  | "production-channel-hard-held"
  | "metrics-not-authoritative"
  | "live-rollout-held";

export interface ExpoUpdateRolloutHealth {
  readonly adoption: ExpoUpdateHealthSignal;
  readonly launchErrors: ExpoUpdateHealthSignal;
  readonly applicationHealth: ExpoUpdateHealthSignal;
}

export interface ExpoUpdateRolloutInput {
  readonly channel: string;
  readonly environment: string;
  readonly currentPercent: number;
  readonly requestedPercent: number;
  readonly health: ExpoUpdateRolloutHealth;
  readonly inventedUserMetrics?: boolean;
  readonly claimLiveRolloutProof?: boolean;
}

export interface ExpoUpdateRolloutDecision {
  readonly action: ExpoUpdateRolloutAction;
  readonly reason?: ExpoUpdateRolloutHoldReason;
  readonly currentPercent: number;
  readonly requestedPercent: number;
  readonly notes: string;
  readonly liveRolloutHeld: true;
}

export const EXPO_UPDATE_ROLLOUT_NOTES = {
  unknownNotHealthy: "Unknown or missing health is not healthy. Hold advancement.",
  noInventedMetrics: "Do not invent measured user counts or fake adoption thresholds.",
  stopBeforeWiden: "Prefer stop-rollout / republish-previous / rollback-to-embedded before widening.",
  productionHardHeld: "Production channel rollout mutation is hard-held.",
  liveHeld: "Live rollout percentage mutation remains held. Fixture models are not runtime proof.",
} as const;

function isProductionScope(channel: string, environment: string): boolean {
  const c = channel.trim().toLowerCase();
  const e = environment.trim().toLowerCase();
  return c === "production" || c === "prod" || e === "production" || e === "prod";
}

function anyAmbiguous(health: ExpoUpdateRolloutHealth): ExpoUpdateRolloutHoldReason | undefined {
  for (const signal of [health.adoption, health.launchErrors, health.applicationHealth]) {
    if (signal === "unhealthy") return "health-unhealthy";
  }
  for (const signal of [health.adoption, health.launchErrors, health.applicationHealth]) {
    if (signal === "missing") return "health-missing";
    if (signal === "unknown") return "health-unknown";
  }
  return undefined;
}

export function assessExpoUpdateRollout(input: ExpoUpdateRolloutInput): ExpoUpdateRolloutDecision {
  const base = {
    currentPercent: input.currentPercent,
    requestedPercent: input.requestedPercent,
    liveRolloutHeld: true as const,
  };

  if (input.claimLiveRolloutProof) {
    return { ...base, action: "hold", reason: "live-rollout-held", notes: EXPO_UPDATE_ROLLOUT_NOTES.liveHeld };
  }
  if (isProductionScope(input.channel, input.environment)) {
    return { ...base, action: "hold", reason: "production-channel-hard-held", notes: EXPO_UPDATE_ROLLOUT_NOTES.productionHardHeld };
  }
  if (input.inventedUserMetrics) {
    return { ...base, action: "hold", reason: "metrics-not-authoritative", notes: EXPO_UPDATE_ROLLOUT_NOTES.noInventedMetrics };
  }

  const ambiguous = anyAmbiguous(input.health);
  const widening = input.requestedPercent > input.currentPercent;

  if (ambiguous) {
    return {
      ...base,
      action: input.health.launchErrors === "unhealthy" || input.health.applicationHealth === "unhealthy" ? "stop-rollout" : "hold",
      reason: ambiguous,
      notes: EXPO_UPDATE_ROLLOUT_NOTES.unknownNotHealthy,
    };
  }

  if (widening) {
    return {
      ...base,
      action: "advance",
      notes: `${EXPO_UPDATE_ROLLOUT_NOTES.liveHeld} Modeled advance only when all health signals are healthy.`,
    };
  }

  if (input.requestedPercent < input.currentPercent) {
    return { ...base, action: "stop-rollout", notes: EXPO_UPDATE_ROLLOUT_NOTES.stopBeforeWiden };
  }

  return { ...base, action: "hold", reason: "live-rollout-held", notes: EXPO_UPDATE_ROLLOUT_NOTES.liveHeld };
}
