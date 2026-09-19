/**
 * Expo web surface decision table (#86).
 *
 * Honest multi-surface classification: native / signed-in browser / public share /
 * marketing-legal / backend-API. Mode selection SPA/static/server/alpha-SSR.
 * Shared TypeScript is not one renderer. Keep a separate marketing site when design says so.
 * Web cannot satisfy native. Alpha SSR refuses unless explicitly selected.
 * This module does not deploy and does not claim live hosting.
 */

import type { ExpoWebSurfaceMode } from "./expo-web-static.js";

export const EXPO_WEB_SURFACE_TABLE_PATH = "catalog/stacks/expo-web-surface-table.ts" as const;

export type ExpoWebProductSurface = "native-app" | "signed-in-browser" | "public-share" | "marketing-legal" | "backend-api";

export type ExpoWebSurfaceRenderClaim = "one-renderer" | "shared-types-only" | "keep-separate-site";

export type ExpoWebSurfaceTableRefusal =
  | "web-is-not-native"
  | "alpha-ssr-not-selected"
  | "shared-ts-is-not-one-renderer"
  | "keep-separate-site"
  | "server-output-is-not-ssr"
  | "static-spa-incompatible-with-api";

export interface ExpoWebSurfaceTableRow {
  readonly surface: ExpoWebProductSurface;
  readonly allowedModes: readonly ExpoWebSurfaceMode[];
  readonly webSatisfiesNative: false;
  readonly notes: string;
}

export const EXPO_WEB_SURFACE_TABLE: readonly ExpoWebSurfaceTableRow[] = [
  {
    surface: "native-app",
    allowedModes: [],
    webSatisfiesNative: false,
    notes: "iOS/Android native runtime. A browser surface cannot satisfy native requirements.",
  },
  {
    surface: "signed-in-browser",
    allowedModes: ["static", "spa", "server"],
    webSatisfiesNative: false,
    notes: "Authenticated browser UX. Needs server auth for protected data; client gates are not a security boundary.",
  },
  {
    surface: "public-share",
    allowedModes: ["static", "spa", "server"],
    webSatisfiesNative: false,
    notes: "Public HTML/share metadata. Private account data must not enter prerender/cache/index without policy.",
  },
  {
    surface: "marketing-legal",
    allowedModes: ["static", "spa"],
    webSatisfiesNative: false,
    notes: "Marketing/legal may stay on a separate Next.js/Astro site. Selecting Expo does not force migration.",
  },
  {
    surface: "backend-api",
    allowedModes: ["server"],
    webSatisfiesNative: false,
    notes: "Production API routes need a real server. Static/SPA cannot execute API routes. web.output:server ≠ SSR.",
  },
] as const;

export interface ExpoWebSurfaceTableDecision {
  readonly action: "accept" | "refuse" | "keep-separate";
  readonly surface: ExpoWebProductSurface;
  readonly mode: ExpoWebSurfaceMode | null;
  readonly webSatisfiesNative: false;
  readonly sharedTsIsOneRenderer: false;
  readonly alphaSsrEnabled: false | true;
  readonly code?: ExpoWebSurfaceTableRefusal;
  readonly reason: string;
}

export function decideExpoWebProductSurface(input: {
  readonly surface: ExpoWebProductSurface;
  readonly requestedMode?: ExpoWebSurfaceMode;
  readonly apiRoutesRequired?: boolean;
  readonly ssrSelected?: boolean;
  readonly renderClaim?: ExpoWebSurfaceRenderClaim;
  readonly existingMarketingSite?: "nextjs" | "astro" | "other" | "none";
}): ExpoWebSurfaceTableDecision {
  const base = {
    surface: input.surface,
    webSatisfiesNative: false as const,
    sharedTsIsOneRenderer: false as const,
    alphaSsrEnabled: Boolean(input.ssrSelected) as false | true,
  };

  if (input.surface === "native-app") {
    return {
      action: "refuse",
      mode: input.requestedMode ?? null,
      ...base,
      code: "web-is-not-native",
      reason: "Native app requirements cannot be satisfied by a web/expo browser surface.",
    };
  }

  if (input.renderClaim === "one-renderer") {
    return {
      action: "refuse",
      mode: input.requestedMode ?? null,
      ...base,
      code: "shared-ts-is-not-one-renderer",
      reason: "Shared TypeScript/components are optional reuse, not proof of one renderer across native and web.",
    };
  }

  if (
    (input.surface === "marketing-legal" || input.renderClaim === "keep-separate-site") &&
    input.existingMarketingSite &&
    input.existingMarketingSite !== "none"
  ) {
    return {
      action: "keep-separate",
      mode: null,
      ...base,
      code: "keep-separate-site",
      reason: "Existing marketing/legal site stays separate unless accepted design says otherwise. Expo selection does not force migration.",
    };
  }

  const mode = input.requestedMode ?? (input.surface === "backend-api" ? "server" : "static");

  if (mode === "alpha-ssr" && !input.ssrSelected) {
    return {
      action: "refuse",
      mode,
      ...base,
      alphaSsrEnabled: false,
      code: "alpha-ssr-not-selected",
      reason: "Alpha SSR stays refuse/hold unless the product explicitly selects it. web.output:server is not SSR enablement.",
    };
  }

  if (mode === "server" && input.ssrSelected !== true && input.surface !== "backend-api") {
    // server output alone is fine for API; do not treat as SSR
  }

  if ((mode === "static" || mode === "spa") && (input.apiRoutesRequired || input.surface === "backend-api")) {
    return {
      action: "refuse",
      mode,
      ...base,
      code: "static-spa-incompatible-with-api",
      reason: "Static/SPA hosting cannot execute production API routes. Select server output with a real host.",
    };
  }

  if (mode === "server" && input.ssrSelected === true && input.surface !== "backend-api") {
    // selected alpha SSR path — still not enabled by silence; caller must pass ssrSelected
  }

  const row = EXPO_WEB_SURFACE_TABLE.find((r) => r.surface === input.surface);
  if (row && row.allowedModes.length > 0 && !row.allowedModes.includes(mode)) {
    if (mode === "alpha-ssr" && input.ssrSelected) {
      return {
        action: "accept",
        mode,
        ...base,
        alphaSsrEnabled: true,
        reason: "Alpha SSR explicitly selected. Requires a deployed server; not local static; not native proof.",
      };
    }
    if (mode === "alpha-ssr") {
      return {
        action: "refuse",
        mode,
        ...base,
        alphaSsrEnabled: false,
        code: "alpha-ssr-not-selected",
        reason: "Alpha SSR is not selected for this surface.",
      };
    }
  }

  if (mode === "server" && !input.ssrSelected) {
    return {
      action: "accept",
      mode,
      ...base,
      alphaSsrEnabled: false,
      reason: "Server output selected for API/server bundle. This is not alpha SSR enablement and not native proof.",
    };
  }

  return {
    action: "accept",
    mode,
    ...base,
    reason: `Surface ${input.surface} classified for mode ${mode}. Web ≠ native. Shared TS ≠ one renderer.`,
  };
}

export function assertWebDoesNotSatisfyNative(): { webSatisfiesNativeRequirement: false } {
  return { webSatisfiesNativeRequirement: false };
}

export function serverOutputIsNotSsr(
  webOutput: "static" | "single" | "server",
  ssrSelected: boolean,
): {
  readonly serverOutput: typeof webOutput;
  readonly ssrEnabled: boolean;
  readonly equivalent: false;
  readonly code?: "server-output-is-not-ssr";
  readonly reason: string;
} {
  if (webOutput === "server" && !ssrSelected) {
    return {
      serverOutput: webOutput,
      ssrEnabled: false,
      equivalent: false,
      code: "server-output-is-not-ssr",
      reason: "web.output:server enables API routes / server bundle. It does not enable alpha SSR by itself.",
    };
  }
  return {
    serverOutput: webOutput,
    ssrEnabled: ssrSelected,
    equivalent: false,
    reason: ssrSelected ? "SSR was explicitly selected; still distinct from mere server output." : "Server output and SSR remain distinct.",
  };
}
