/**
 * EAS Hosting selection models + alternate-host compatibility matrix (#86).
 *
 * EAS Hosting is optional — not required because the app selected Expo.
 * Unsupported selected host → precise decision request; never silent host switch.
 * Models + authority gates only; live hosting deploy remains held.
 */

export const EXPO_EAS_HOSTING_PATH = "catalog/stacks/expo-eas-hosting.ts" as const;

export type ExpoHostingHostId = "eas-hosting" | "vercel" | "netlify" | "cloudflare-pages" | "github-pages" | "custom-static" | "unsupported";

export type ExpoHostingAdapterKind = "static-export" | "server-output" | "unknown";

export type ExpoHostingCompatibility = "compatible-static" | "compatible-server-unknown" | "incompatible" | "decision-required" | "unselected";

export interface ExpoHostingHostMatrixRow {
  readonly host: ExpoHostingHostId;
  readonly adapter: ExpoHostingAdapterKind;
  readonly compatibility: ExpoHostingCompatibility;
  readonly silentSwitchAllowed: false;
  readonly liveDeploy: "held";
  readonly notes: string;
}

export const EXPO_HOSTING_HOST_MATRIX: readonly ExpoHostingHostMatrixRow[] = [
  {
    host: "eas-hosting",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "EAS Hosting models fixture-tested as dry-run. Live deploy not-run. Optional.",
  },
  {
    host: "eas-hosting",
    adapter: "server-output",
    compatibility: "compatible-server-unknown",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Server output on EAS Hosting needs deploy authority. Dry-run models only in #86.",
  },
  {
    host: "vercel",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Alternate static host may serve Expo static export. Not auto-selected. Live held.",
  },
  {
    host: "netlify",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Alternate static host may serve Expo static export. Not auto-selected. Live held.",
  },
  {
    host: "cloudflare-pages",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Alternate static host may serve Expo static export. Not auto-selected. Live held.",
  },
  {
    host: "github-pages",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Static-only. Cannot execute API/server output. Live held.",
  },
  {
    host: "custom-static",
    adapter: "static-export",
    compatibility: "compatible-static",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Custom static CDN/bucket. API/SSR incompatible. Live held.",
  },
  {
    host: "unsupported",
    adapter: "unknown",
    compatibility: "decision-required",
    silentSwitchAllowed: false,
    liveDeploy: "held",
    notes: "Unsupported selected host requires an explicit decision request. Never silent-switch.",
  },
] as const;

export type ExpoHostingHostDecision =
  | {
      readonly action: "accept-model";
      readonly host: ExpoHostingHostId;
      readonly compatibility: ExpoHostingCompatibility;
      readonly silentSwitch: false;
      readonly liveDeploy: false;
      readonly notes: string;
    }
  | {
      readonly action: "decision-request";
      readonly host: ExpoHostingHostId;
      readonly compatibility: "decision-required" | "incompatible";
      readonly silentSwitch: false;
      readonly liveDeploy: false;
      readonly notes: string;
    }
  | {
      readonly action: "unselected";
      readonly host: null;
      readonly compatibility: "unselected";
      readonly silentSwitch: false;
      readonly liveDeploy: false;
      readonly notes: string;
    }
  | {
      readonly action: "refuse-silent-switch";
      readonly host: ExpoHostingHostId;
      readonly fromHost: ExpoHostingHostId;
      readonly silentSwitch: false;
      readonly liveDeploy: false;
      readonly notes: string;
    };

export function decideExpoHostingHost(input: {
  readonly selectedHost?: ExpoHostingHostId | null;
  readonly adapter: ExpoHostingAdapterKind;
  readonly attemptSilentSwitchTo?: ExpoHostingHostId;
  readonly uncertainDeploy?: boolean;
}): ExpoHostingHostDecision {
  if (!input.selectedHost) {
    return {
      action: "unselected",
      host: null,
      compatibility: "unselected",
      silentSwitch: false,
      liveDeploy: false,
      notes: "Hosting unselected. Selecting Expo does not force EAS Hosting or any host.",
    };
  }

  if (input.attemptSilentSwitchTo && input.attemptSilentSwitchTo !== input.selectedHost) {
    return {
      action: "refuse-silent-switch",
      host: input.attemptSilentSwitchTo,
      fromHost: input.selectedHost,
      silentSwitch: false,
      liveDeploy: false,
      notes: "Never silently switch hosts after uncertain or failed deploy. Request an explicit decision.",
    };
  }

  if (input.uncertainDeploy && input.attemptSilentSwitchTo) {
    return {
      action: "refuse-silent-switch",
      host: input.attemptSilentSwitchTo,
      fromHost: input.selectedHost,
      silentSwitch: false,
      liveDeploy: false,
      notes: "Uncertain deploy must not flip hosts. Reconcile, then decide explicitly.",
    };
  }

  if (input.selectedHost === "unsupported") {
    return {
      action: "decision-request",
      host: input.selectedHost,
      compatibility: "decision-required",
      silentSwitch: false,
      liveDeploy: false,
      notes: "Selected host is unsupported for this Expo web adapter. Precise decision request required.",
    };
  }

  const row = EXPO_HOSTING_HOST_MATRIX.find((r) => r.host === input.selectedHost && r.adapter === input.adapter);
  if (!row) {
    if (input.adapter === "server-output" && input.selectedHost !== "eas-hosting") {
      return {
        action: "decision-request",
        host: input.selectedHost,
        compatibility: "incompatible",
        silentSwitch: false,
        liveDeploy: false,
        notes: `Host ${input.selectedHost} has no proven server-output adapter in #86. Decision required; no silent switch.`,
      };
    }
    return {
      action: "decision-request",
      host: input.selectedHost,
      compatibility: "decision-required",
      silentSwitch: false,
      liveDeploy: false,
      notes: "No matrix row for host/adapter pair. Decision required.",
    };
  }

  if (row.compatibility === "decision-required" || row.compatibility === "incompatible") {
    return {
      action: "decision-request",
      host: input.selectedHost,
      compatibility: row.compatibility === "incompatible" ? "incompatible" : "decision-required",
      silentSwitch: false,
      liveDeploy: false,
      notes: row.notes,
    };
  }

  return {
    action: "accept-model",
    host: input.selectedHost,
    compatibility: row.compatibility,
    silentSwitch: false,
    liveDeploy: false,
    notes: `${row.notes} Dry-run models only; live hosting held.`,
  };
}

export const EXPO_EAS_HOSTING_NOTES = {
  optional: "EAS Hosting is optional — not required because the app selected Expo.",
  noSilentSwitch: "Unsupported or uncertain hosts never silent-switch.",
  liveHeld: "Live hosting deploy / promote / domain remain held without HoE authority.",
} as const;
