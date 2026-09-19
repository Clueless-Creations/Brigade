/**
 * Production API origin validation + shipped-artifact canary scan (#86).
 *
 * Localhost / wrong ephemeral preview must fail as a release origin.
 * Lack of EXPO_PUBLIC_ is not non-leak proof. Canaries fail closed across
 * client bundles, HTML, config, and source maps. Fake transport only.
 */

import { scanClientArtifacts, type ClientArtifact, type ClientSecretScan, type SecretCanary } from "../../../catalog/stacks/expo-capability-protocol.js";

export const EXPO_WEB_API_CONTRACT_PATH = "adapters/providers/expo/web-api-contract.ts" as const;

export type ExpoProductionApiOriginRefuse =
  "localhost-origin" | "loopback-origin" | "ephemeral-preview-origin" | "missing-origin" | "insecure-http-origin" | "metro-relative-is-not-production";

export type ExpoShippedArtifactKind = "client-bundle" | "html" | "app-config" | "source-map" | "asset" | "response";

export interface ExpoShippedWebArtifact extends ClientArtifact {
  readonly kind: ExpoShippedArtifactKind;
}

export type ExpoProductionApiOriginResult =
  | {
      readonly status: "accept";
      readonly origin: string;
      readonly releaseReady: true;
      readonly livePreview: false;
      readonly notes: string;
    }
  | {
      readonly status: "refuse";
      readonly reason: ExpoProductionApiOriginRefuse;
      readonly releaseReady: false;
      readonly livePreview: false;
      readonly notes: string;
    };

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function parseOriginHost(origin: string): { protocol: string; host: string } | null {
  try {
    const url = new URL(origin);
    return { protocol: url.protocol.replace(/:$/, ""), host: url.hostname.toLowerCase() };
  } catch {
    return null;
  }
}

function looksEphemeralPreview(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h.endsWith(".exp.direct") ||
    h.endsWith(".expo.app") ||
    h.endsWith(".expo.dev") ||
    h.includes("ngrok") ||
    h.includes("localtunnel") ||
    /^([a-z0-9-]+\.)*(preview|pr-\d+|ephemeral)\./.test(h)
  );
}

export function validateProductionApiOrigin(input: {
  readonly origin: string;
  readonly allowHttp?: boolean;
  readonly claimMetroRelativeAsProduction?: boolean;
}): ExpoProductionApiOriginResult {
  const denied = (reason: ExpoProductionApiOriginRefuse, notes: string): ExpoProductionApiOriginResult => ({
    status: "refuse",
    reason,
    releaseReady: false,
    livePreview: false,
    notes,
  });

  if (input.claimMetroRelativeAsProduction) {
    return denied("metro-relative-is-not-production", "A Metro relative fetch succeeding in dev is not production API origin proof.");
  }
  const raw = input.origin?.trim() ?? "";
  if (!raw) {
    return denied("missing-origin", "Production API origin is required before release.");
  }
  const parsed = parseOriginHost(raw);
  if (!parsed) {
    return denied("missing-origin", "Production API origin must be an absolute URL.");
  }
  if (LOCALHOST_HOSTS.has(parsed.host)) {
    return denied("localhost-origin", "Localhost cannot be a production API release origin.");
  }
  if (parsed.host.endsWith(".local") || parsed.host === "10.0.2.2") {
    return denied("loopback-origin", "Loopback / emulator hostnames cannot be a production API release origin.");
  }
  if (looksEphemeralPreview(parsed.host)) {
    return denied("ephemeral-preview-origin", "Ephemeral preview hosts cannot be bound as the production API release origin.");
  }
  if (parsed.protocol === "http" && input.allowHttp !== true) {
    return denied("insecure-http-origin", "Production API origin must use https unless explicitly waived.");
  }
  return {
    status: "accept",
    origin: raw,
    releaseReady: true,
    livePreview: false,
    notes: "Origin accepted for release validation. Server readback still required in live journeys (held).",
  };
}

export function scanShippedWebArtifacts(
  artifacts: readonly ExpoShippedWebArtifact[],
  canaries: readonly SecretCanary[],
): ClientSecretScan & { readonly scannedKinds: readonly ExpoShippedArtifactKind[]; readonly failClosed: true } {
  const scan = scanClientArtifacts(artifacts, canaries);
  const scannedKinds = [...new Set(artifacts.map((a) => a.kind))];
  if (scan.action === "refuse") {
    return { ...scan, scannedKinds, failClosed: true };
  }
  // Lack of EXPO_PUBLIC_ is not proof of non-leak — canaries must still be absent.
  return { action: "pass", leaks: scan.leaks, scannedKinds, failClosed: true };
}

export function assertCanaryFailClosed(scan: ClientSecretScan): { readonly ok: boolean; readonly failClosed: true } {
  if (scan.action === "refuse") {
    return { ok: false, failClosed: true };
  }
  return { ok: true, failClosed: true };
}

export type ExpoClientServerContractKind = "browser" | "native";

export interface ExpoClientServerContractVersion {
  readonly clientKind: ExpoClientServerContractKind;
  readonly clientContractVersion: string;
  readonly serverContractVersion: string;
  readonly previewGone?: boolean;
}

export type ExpoClientServerCompatResult =
  | {
      readonly status: "compatible";
      readonly livePreview: false;
      readonly dataLoss: false;
      readonly notes: string;
    }
  | {
      readonly status: "incompatible-recovery";
      readonly livePreview: false;
      readonly dataLoss: false;
      readonly notes: string;
    }
  | {
      readonly status: "refuse-implicit-loss";
      readonly livePreview: false;
      readonly dataLoss: false;
      readonly notes: string;
    };

export function assessClientServerContractCompatibility(input: ExpoClientServerContractVersion): ExpoClientServerCompatResult {
  if (input.previewGone) {
    return {
      status: "incompatible-recovery",
      livePreview: false,
      dataLoss: false,
      notes: "Preview went away. Clients must surface a compatible recovery error; do not silently repoint to ephemeral URLs.",
    };
  }
  if (input.clientContractVersion === input.serverContractVersion) {
    return {
      status: "compatible",
      livePreview: false,
      dataLoss: false,
      notes: `Synthetic ${input.clientKind} client matches server contract ${input.serverContractVersion}. Not live preview.`,
    };
  }
  return {
    status: "incompatible-recovery",
    livePreview: false,
    dataLoss: false,
    notes: `Client ${input.clientContractVersion} diverges from server ${input.serverContractVersion}. Require compatible error/recovery; no implicit data loss.`,
  };
}

export const EXPO_WEB_API_CONTRACT_NOTES = {
  localhostRefused: "Localhost / wrong preview cannot be a production API origin.",
  canaryFailClosed: "Secret canaries in client/HTML/config/source maps fail closed.",
  expoPublicNotProof: "Absence of EXPO_PUBLIC_ is not non-leak proof.",
  metroNotProduction: "Metro relative success ≠ production backend proof.",
} as const;
