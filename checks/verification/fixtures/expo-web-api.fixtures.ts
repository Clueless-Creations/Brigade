/**
 * #86 Expo web API route contracts, production origin validation, canary fail-closed,
 * and browser/native client contract fixtures. Deterministic only. No live preview.
 */
import {
  EXPO_WEB_API_NOTES,
  evaluateSyntheticApiRequest,
  refuseClientRouteAsServerBoundary,
  refuseSecondLoginService,
  validateExpoWebApiRouteContract,
  validateExpoWebApiSurface,
  type ExpoWebApiRouteContract,
} from "../../../catalog/stacks/expo-web-api-routes.js";
import {
  decideExpoWebProductSurface,
  serverOutputIsNotSsr,
  assertWebDoesNotSatisfyNative,
  EXPO_WEB_SURFACE_TABLE,
} from "../../../catalog/stacks/expo-web-surface-table.js";
import {
  EXPO_WEB_API_CONTRACT_NOTES,
  assessClientServerContractCompatibility,
  assertCanaryFailClosed,
  scanShippedWebArtifacts,
  validateProductionApiOrigin,
} from "../../../adapters/providers/expo/web-api-contract.js";
import { assert, type Harness } from "./_harness.js";

const browserContract: ExpoWebApiRouteContract = {
  routeId: "api/me",
  method: "GET",
  requiresAuth: true,
  clientKind: "browser-cookie-session",
  typedValidation: true,
  serverAuthorization: true,
  rateLimitPerMinute: 60,
  maxBodyBytes: 64_000,
  safeErrors: true,
  csrfProtection: true,
  corsAllowCredentials: true,
  corsAllowedOrigins: ["https://app.example.com"],
};

const nativeContract: ExpoWebApiRouteContract = {
  routeId: "api/me",
  method: "GET",
  requiresAuth: true,
  clientKind: "native-bearer",
  typedValidation: true,
  serverAuthorization: true,
  rateLimitPerMinute: 120,
  maxBodyBytes: 64_000,
  safeErrors: true,
};

const CANARIES = [
  { name: "EXPO_TOKEN", value: "CANARY_EXPO_TOKEN_NOT_A_SECRET" },
  { name: "OPENAI_API_KEY", value: "CANARY_OPENAI_API_KEY_NOT_A_SECRET" },
  { name: "AUTH_REFRESH_TOKEN", value: "CANARY_REFRESH_TOKEN_NOT_A_SECRET" },
  { name: "EXPO_PUBLIC_API_URL", value: "https://example.invalid/public" },
] as const;

export function register(harness: Harness): void {
  harness.check("expo-web-api: surface table keeps web≠native, separate site, alpha SSR refuse", () => {
    assert(EXPO_WEB_SURFACE_TABLE.length >= 5, "surface table has native/browser/share/marketing/api rows");
    assert(assertWebDoesNotSatisfyNative().webSatisfiesNativeRequirement === false, "web≠native invariant");
    const native = decideExpoWebProductSurface({ surface: "native-app", requestedMode: "static" });
    assert(native.action === "refuse" && native.code === "web-is-not-native", native.reason);
    const oneRenderer = decideExpoWebProductSurface({
      surface: "signed-in-browser",
      requestedMode: "static",
      renderClaim: "one-renderer",
    });
    assert(oneRenderer.action === "refuse" && oneRenderer.code === "shared-ts-is-not-one-renderer", oneRenderer.reason);
    const keep = decideExpoWebProductSurface({
      surface: "marketing-legal",
      existingMarketingSite: "nextjs",
      renderClaim: "keep-separate-site",
    });
    assert(keep.action === "keep-separate" && keep.code === "keep-separate-site", keep.reason);
    const ssr = decideExpoWebProductSurface({ surface: "signed-in-browser", requestedMode: "alpha-ssr" });
    assert(ssr.action === "refuse" && ssr.code === "alpha-ssr-not-selected", ssr.reason);
    const ssrSelected = decideExpoWebProductSurface({
      surface: "signed-in-browser",
      requestedMode: "alpha-ssr",
      ssrSelected: true,
    });
    assert(ssrSelected.action === "accept" && ssrSelected.alphaSsrEnabled === true, ssrSelected.reason);
    const notSsr = serverOutputIsNotSsr("server", false);
    assert(notSsr.equivalent === false && notSsr.ssrEnabled === false && notSsr.code === "server-output-is-not-ssr", notSsr.reason);
    const staticApi = decideExpoWebProductSurface({
      surface: "backend-api",
      requestedMode: "static",
      apiRoutesRequired: true,
    });
    assert(staticApi.action === "refuse" && staticApi.code === "static-spa-incompatible-with-api", staticApi.reason);
  });

  harness.check("expo-web-api: static/SPA + API refuse; client route ≠ server; no second login", () => {
    const staticRefuse = validateExpoWebApiSurface({ mode: "static", apiRoutesSelected: true });
    assert(staticRefuse.status === "refuse" && staticRefuse.reason === "static-plus-api-routes", staticRefuse.notes);
    const spaRefuse = validateExpoWebApiSurface({ mode: "spa", apiRoutesSelected: true });
    assert(spaRefuse.status === "refuse" && spaRefuse.reason === "spa-plus-api-routes", spaRefuse.notes);
    const serverOk = validateExpoWebApiSurface({ mode: "server", apiRoutesSelected: true });
    assert(serverOk.status === "accept-contract" && serverOk.livePreview === false, serverOk.notes);
    const clientGate = refuseClientRouteAsServerBoundary();
    assert(clientGate.status === "refuse" && clientGate.reason === "client-route-is-not-server-boundary", clientGate.notes);
    assert(clientGate.notes.includes("client gate") || EXPO_WEB_API_NOTES.clientRouteNotBoundary.length > 0, "client≠server noted");
    const secondLogin = refuseSecondLoginService();
    assert(secondLogin.status === "refuse" && secondLogin.reason === "second-login-refused", secondLogin.notes);
  });

  harness.check("expo-web-api: browser CSRF/CORS vs native bearer contracts + synthetic rejects", () => {
    const browserOk = validateExpoWebApiRouteContract(browserContract);
    assert(browserOk.status === "accept-contract", browserOk.notes);
    const missingCsrf = validateExpoWebApiRouteContract({ ...browserContract, csrfProtection: false });
    assert(missingCsrf.status === "refuse" && missingCsrf.reason === "csrf-required-for-browser", missingCsrf.notes);
    const badCors = validateExpoWebApiRouteContract({
      ...browserContract,
      corsAllowCredentials: true,
      corsAllowedOrigins: [],
    });
    assert(badCors.status === "refuse" && badCors.reason === "cors-misconfigured", badCors.notes);
    const nativeOk = validateExpoWebApiRouteContract(nativeContract);
    assert(nativeOk.status === "accept-contract", nativeOk.notes);

    const forged = evaluateSyntheticApiRequest({ contract: nativeContract, forgedToken: true, authToken: "x" });
    assert(forged.status === "reject" && forged.reason === "forged-token", forged.notes);
    const expired = evaluateSyntheticApiRequest({ contract: browserContract, sessionExpired: true });
    assert(expired.status === "reject" && expired.reason === "expired-session", expired.notes);
    const cross = evaluateSyntheticApiRequest({
      contract: nativeContract,
      authToken: "tok",
      requestAccountId: "a",
      resourceAccountId: "b",
    });
    assert(cross.status === "reject" && cross.reason === "cross-account", cross.notes);
    const cache = evaluateSyntheticApiRequest({
      contract: browserContract,
      cacheVisibility: "public-shared",
    });
    assert(cache.status === "reject" && cache.reason === "shared-cache-leak", cache.notes);
    const oversized = evaluateSyntheticApiRequest({
      contract: nativeContract,
      authToken: "tok",
      bodyBytes: 1_000_000,
    });
    assert(oversized.status === "reject" && oversized.reason === "rate-or-size-exceeded", oversized.notes);
    const ok = evaluateSyntheticApiRequest({
      contract: nativeContract,
      authToken: "tok",
      requestAccountId: "a",
      resourceAccountId: "a",
    });
    assert(ok.status === "ok" && ok.livePreview === false, ok.notes);
  });

  harness.check("expo-web-api: production origin refuses localhost/preview; canary fail-closed on HTML/maps", () => {
    const local = validateProductionApiOrigin({ origin: "http://localhost:8081" });
    assert(local.status === "refuse" && local.reason === "localhost-origin", local.notes);
    const preview = validateProductionApiOrigin({ origin: "https://abc.exp.direct" });
    assert(preview.status === "refuse" && preview.reason === "ephemeral-preview-origin", preview.notes);
    const metro = validateProductionApiOrigin({
      origin: "https://api.example.com",
      claimMetroRelativeAsProduction: true,
    });
    assert(metro.status === "refuse" && metro.reason === "metro-relative-is-not-production", metro.notes);
    const good = validateProductionApiOrigin({ origin: "https://api.example.com" });
    assert(good.status === "accept" && good.releaseReady === true && good.livePreview === false, good.notes);
    assert(EXPO_WEB_API_CONTRACT_NOTES.localhostRefused.includes("Localhost"), "notes document origin refuse");

    const leaked = scanShippedWebArtifacts(
      [
        { kind: "html", path: "dist/index.html", contents: `<html>${CANARIES[0].value}</html>` },
        { kind: "source-map", path: "dist/app.js.map", contents: `{"mappings":"${CANARIES[1].value}"}` },
        { kind: "app-config", path: "app.config.js", contents: `token=${CANARIES[2].value}` },
        { kind: "client-bundle", path: "dist/bundle.js", contents: "ok" },
      ],
      CANARIES,
    );
    assert(leaked.action === "refuse" && leaked.failClosed === true, "canary must fail closed");
    assert(leaked.leaks.length >= 3, `expected multi-kind leaks, got ${leaked.leaks.length}`);
    assert(assertCanaryFailClosed(leaked).ok === false, "assertCanaryFailClosed fails on leak");

    const clean = scanShippedWebArtifacts(
      [
        { kind: "html", path: "dist/index.html", contents: `<html>${CANARIES[3].value}</html>` },
        { kind: "source-map", path: "dist/app.js.map", contents: '{"mappings":""}' },
        { kind: "client-bundle", path: "dist/bundle.js", contents: "export default 1" },
      ],
      CANARIES,
    );
    assert(clean.action === "pass" && clean.failClosed === true, "public canary may appear; secrets must not");
    assert(clean.scannedKinds.includes("html") && clean.scannedKinds.includes("source-map"), "kinds recorded");
  });

  harness.check("expo-web-api: old/new client vs server contract fixtures (fake transport)", () => {
    const match = assessClientServerContractCompatibility({
      clientKind: "browser",
      clientContractVersion: "1.0.0",
      serverContractVersion: "1.0.0",
    });
    assert(match.status === "compatible" && match.livePreview === false && match.dataLoss === false, match.notes);
    const diverge = assessClientServerContractCompatibility({
      clientKind: "native",
      clientContractVersion: "1.0.0",
      serverContractVersion: "2.0.0",
    });
    assert(diverge.status === "incompatible-recovery" && diverge.dataLoss === false, diverge.notes);
    const gone = assessClientServerContractCompatibility({
      clientKind: "native",
      clientContractVersion: "1.0.0",
      serverContractVersion: "1.0.0",
      previewGone: true,
    });
    assert(gone.status === "incompatible-recovery" && gone.notes.includes("Preview went away"), gone.notes);
  });
}
