/**
 * Apple ASC → canonical-operation inventory + classification (#113).
 *
 * Proving-provider map for ADR-0013: native ASC CLI/API capabilities map to
 * canonical store operations. Workflows depend on those operations; the
 * adapter owns command syntax and response envelopes. Independent cookbook
 * samples at ASC CLI 5.1.0 establish request/response shapes. Fake runners
 * and adapter-built argv are wiring evidence only — never the contract source.
 *
 * Evidence classes stay distinct: fixture ≠ sandbox-held ≠ TestFlight ≠
 * App Review ≠ production release. Protected effects (submit/release/
 * credentials/create) stay authority-gated; `--yes` / noninteractive never
 * grants authority.
 *
 * Consumes landed surfaces: apple-asc.yaml, adapters/app-review/*, rork
 * upstream, checks/verification/test/data/asc-cli (5.1.0), #38 media
 * standing envelope. Does not replace #23/#38/#60/#61/#62 owners.
 * Does not start #114–#116.
 */

export const ASC_CLI_REVIEWED_VERSION = "5.1.0" as const;
export const ASC_CLI_REVIEWED_REVISION = "ca759a3b6ab88c8c39aed13325461248436615ca" as const;
export const APPLE_ASC_CANONICAL_MAP_PATH = "catalog/providers/apple-asc-canonical-map.ts" as const;
export const APPLE_ASC_CANONICAL_INVENTORY_DOC = "checks/verification/rehearsal/asc-canonical-inventory.md" as const;

/** Independent cookbook root (5.1.0). Fake/doctor ASC facts must not invent shapes here. */
export const ASC_CLI_COOKBOOK_DIR = "checks/verification/test/data/asc-cli" as const;

export const ASC_EVIDENCE_CLASSES = ["fixture", "sandbox-held", "testflight-held", "review-held", "production-held"] as const;
export type AscEvidenceClass = (typeof ASC_EVIDENCE_CLASSES)[number];

export const ASC_EFFECT_CLASSES = ["read", "mutation", "publish", "credential", "create"] as const;
export type AscEffectClass = (typeof ASC_EFFECT_CLASSES)[number];

/**
 * Authority posture for the canonical op. `--yes` / noninteractive never
 * promote a row out of founder-protected or rejected.
 */
export const ASC_AUTHORITY_CLASSES = ["observe", "standing-envelope", "founder-protected", "rejected"] as const;
export type AscAuthorityClass = (typeof ASC_AUTHORITY_CLASSES)[number];

export const ASC_OP_CLASSES = [
  "observe",
  "create",
  "metadata",
  "localization",
  "media",
  "upload",
  "testflight",
  "review-submit",
  "release",
  "readback",
] as const;
export type AscOpClass = (typeof ASC_OP_CLASSES)[number];

export const ASC_SEAM_ROLES = ["definition", "encoder", "transport", "decoder", "reconciler"] as const;
export type AscSeamRole = (typeof ASC_SEAM_ROLES)[number];

export type AscMappingDisposition = "implement" | "extension" | "defer" | "reject" | "held";

export interface AscCanonicalMapRow {
  readonly id: string;
  readonly opClass: AscOpClass;
  readonly nativeCapability: string;
  readonly canonicalOperation: string | "none";
  readonly implementationPointer: string;
  readonly evidenceClass: AscEvidenceClass;
  readonly effectClass: AscEffectClass;
  readonly authorityClass: AscAuthorityClass;
  readonly disposition: AscMappingDisposition;
  readonly ownerIssue: string;
  readonly residual: boolean;
  readonly notes: string;
}

/**
 * Logical ADR-0013 seams for the ASC path. Responsibilities — not a mandatory
 * five-class framework. Encoder/transport/decoder stay in adapters/app-review;
 * reconciliation stays on canonical App Review / store standing-envelope state.
 */
export const ASC_LOGICAL_SEAMS: readonly {
  readonly role: AscSeamRole;
  readonly owner: string;
  readonly responsibility: string;
}[] = [
  {
    role: "definition",
    owner: "catalog/providers/apple-asc.yaml + apple-asc-canonical-map.ts",
    responsibility: "Supported observe features, native→canonical map, evidence/authority tags",
  },
  {
    role: "encoder",
    owner: "adapters/app-review/asc-provider.ts + resubmit.ts",
    responsibility: "Canonical request → ASC argv (observe argv; recorded resubmit command string)",
  },
  {
    role: "transport",
    owner: "adapters/app-review/asc-provider.ts (AscCommandRunner / spawnAscCommand)",
    responsibility: "Host-controlled process boundary; injectable fake runners for wiring only",
  },
  {
    role: "decoder",
    owner: "adapters/app-review/asc-provider.ts",
    responsibility: "ASC CLI JSON → AppReviewSnapshot layers; never decides business acceptance",
  },
  {
    role: "reconciler",
    owner: "adapters/app-review/poll.ts + resubmit.ts + standing-envelope workflows",
    responsibility: "Canonical observations → next canonical ops; resume verify after mutation",
  },
] as const;

/**
 * Full inventory: native capability → canonical operation → impl → evidence.
 * Held rows stay held (no live sandbox / submit / release / create / credentials).
 */
export const APPLE_ASC_CANONICAL_MAP: readonly AscCanonicalMapRow[] = [
  {
    id: "observe-review-status",
    opClass: "observe",
    nativeCapability: "asc review status",
    canonicalOperation: "workflow.store.app-review-observe",
    implementationPointer: "adapters/app-review/asc-provider.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Independent 5.1.0 reviewStatusResult object; fake argv ≠ contract",
  },
  {
    id: "observe-agreements-status",
    opClass: "observe",
    nativeCapability: "asc web agreements status",
    canonicalOperation: "workflow.store.app-review-observe",
    implementationPointer: "catalog/providers/apple-asc.yaml",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Accept remains rejected/forbidden",
  },
  {
    id: "observe-portfolio-apps-list",
    opClass: "observe",
    nativeCapability: "asc apps list",
    canonicalOperation: "workflow.operations.live-app-store-portfolio",
    implementationPointer: "checks/validation/business/store/check-app-store-portfolio.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#23/#60/#61/#62",
    residual: false,
    notes: "Receipt consumer only — not a second App Store state store",
  },
  {
    id: "observe-version-capabilities",
    opClass: "observe",
    nativeCapability: "asc version / asc capabilities",
    canonicalOperation: "workflow.store.app-review-observe",
    implementationPointer: "adapters/app-review/capability.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Typed feature ids in apple-asc.yaml",
  },
  {
    id: "create-app-record",
    opClass: "create",
    nativeCapability: "asc apps create (and related app-record creation)",
    canonicalOperation: "none",
    implementationPointer: "AUTHORITY-LOCKS + first-run portfolio owners",
    evidenceClass: "sandbox-held",
    effectClass: "create",
    authorityClass: "founder-protected",
    disposition: "held",
    ownerIssue: "#23/#60/#61/#62",
    residual: true,
    notes: "App creation stays founder-held; #113 does not implement live create",
  },
  {
    id: "metadata-validate",
    opClass: "metadata",
    nativeCapability: "asc metadata validate",
    canonicalOperation: "workflow.store.app-review-remediate",
    implementationPointer: "catalog/providers/apple-asc.yaml",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Independent ValidateResult object at 5.1.0",
  },
  {
    id: "metadata-push-dry-run",
    opClass: "metadata",
    nativeCapability: "asc metadata push --dry-run",
    canonicalOperation: "workflow.store.app-review-remediate",
    implementationPointer: "catalog/providers/apple-asc.yaml",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Independent PushPlanResult dry-run object",
  },
  {
    id: "metadata-push-live",
    opClass: "metadata",
    nativeCapability: "asc metadata push",
    canonicalOperation: "workflow.store.apple-store-metadata-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "sandbox-held",
    effectClass: "mutation",
    authorityClass: "standing-envelope",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Live push founder-gated via standing envelope; cookbook records dry-run only",
  },
  {
    id: "localization-metadata",
    opClass: "localization",
    nativeCapability: "asc metadata push (locale-scoped plan items)",
    canonicalOperation: "workflow.store.apple-store-metadata-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "mutation",
    authorityClass: "standing-envelope",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "L10n stays under metadata standing envelope; distinct from media wells",
  },
  {
    id: "media-sizes",
    opClass: "media",
    nativeCapability: "asc screenshots sizes",
    canonicalOperation: "workflow.store.apple-store-media-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#38",
    residual: false,
    notes: "#38 media owner; not a dependency of all asc-cli-automation",
  },
  {
    id: "media-validate",
    opClass: "media",
    nativeCapability: "asc screenshots validate",
    canonicalOperation: "workflow.store.apple-store-media-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#38",
    residual: false,
    notes: "Independent screenshotValidateResult ready object",
  },
  {
    id: "media-upload",
    opClass: "media",
    nativeCapability: "asc screenshots upload",
    canonicalOperation: "workflow.store.apple-store-media-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "mutation",
    authorityClass: "standing-envelope",
    disposition: "implement",
    ownerIssue: "#38",
    residual: false,
    notes: "Dry-run independent envelope; live upload standing-envelope gated",
  },
  {
    id: "media-download",
    opClass: "media",
    nativeCapability: "asc screenshots download",
    canonicalOperation: "workflow.store.apple-store-media-standing-envelope",
    implementationPointer: "checks/verification/test/data/asc-cli/screenshots-download-object.json",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#38",
    residual: false,
    notes: "Readback/observe media; #38 remains owner",
  },
  {
    id: "upload-build",
    opClass: "upload",
    nativeCapability: "build upload / already-uploaded proof for resubmit",
    canonicalOperation: "workflow.store.app-review-resubmit",
    implementationPointer: "adapters/app-review/resubmit.ts",
    evidenceClass: "sandbox-held",
    effectClass: "mutation",
    authorityClass: "founder-protected",
    disposition: "held",
    ownerIssue: "#113",
    residual: true,
    notes: "Resubmit records submit only with alreadyUploaded proof; this slice does not upload binaries",
  },
  {
    id: "testflight-feedback",
    opClass: "testflight",
    nativeCapability: "asc testflight feedback list",
    canonicalOperation: "workflow.store.apple-testflight-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "TF observe ≠ App Review ≠ production release",
  },
  {
    id: "testflight-crashes",
    opClass: "testflight",
    nativeCapability: "asc testflight crashes list",
    canonicalOperation: "workflow.store.apple-testflight-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Crash list observe under TF standing envelope",
  },
  {
    id: "testflight-beta-workflow",
    opClass: "testflight",
    nativeCapability: "asc workflow run testflight_beta",
    canonicalOperation: "workflow.store.apple-testflight-standing-envelope",
    implementationPointer: "catalog/workflows/build-release.ts",
    evidenceClass: "testflight-held",
    effectClass: "mutation",
    authorityClass: "standing-envelope",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Live TF group assignment held; cookbook dry-run/read forms only",
  },
  {
    id: "review-submit",
    opClass: "review-submit",
    nativeCapability: "asc review submit",
    canonicalOperation: "workflow.store.app-review-resubmit",
    implementationPointer: "adapters/app-review/resubmit.ts",
    evidenceClass: "review-held",
    effectClass: "mutation",
    authorityClass: "founder-protected",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Adapter records command; live App Review submit remains authority-held (no sandbox this slice)",
  },
  {
    id: "release-publish",
    opClass: "release",
    nativeCapability: "asc publish appstore --submit",
    canonicalOperation: "none",
    implementationPointer: "adapters/app-review/mandate.ts",
    evidenceClass: "production-held",
    effectClass: "publish",
    authorityClass: "rejected",
    disposition: "reject",
    ownerIssue: "#113",
    residual: false,
    notes: "Always forbidden in App Review lane; production release hard-held",
  },
  {
    id: "release-pending-developer",
    opClass: "release",
    nativeCapability: "pending developer release / public release state",
    canonicalOperation: "none",
    implementationPointer: "AUTHORITY-LOCKS",
    evidenceClass: "production-held",
    effectClass: "publish",
    authorityClass: "founder-protected",
    disposition: "held",
    ownerIssue: "#113",
    residual: true,
    notes: "Separate founder yes after review accept; never greenwashed from fixture success",
  },
  {
    id: "readback-after-mutation",
    opClass: "readback",
    nativeCapability: "asc review status (post-submit / post-metadata readback)",
    canonicalOperation: "workflow.store.app-review-observe",
    implementationPointer: "adapters/app-review/resubmit.ts + poll.ts",
    evidenceClass: "fixture",
    effectClass: "read",
    authorityClass: "observe",
    disposition: "implement",
    ownerIssue: "#113",
    residual: false,
    notes: "Failed verify resumes observation — never blind mutation replay",
  },
  {
    id: "credentials-agreements-accept",
    opClass: "observe",
    nativeCapability: "asc web agreements accept",
    canonicalOperation: "none",
    implementationPointer: "adapters/app-review/mandate.ts",
    evidenceClass: "sandbox-held",
    effectClass: "credential",
    authorityClass: "rejected",
    disposition: "reject",
    ownerIssue: "#113",
    residual: false,
    notes: "Credential/agreement mutation always forbidden",
  },
  {
    id: "credentials-webhooks-serve",
    opClass: "observe",
    nativeCapability: "asc webhooks serve",
    canonicalOperation: "none",
    implementationPointer: "adapters/app-review/mandate.ts",
    evidenceClass: "sandbox-held",
    effectClass: "publish",
    authorityClass: "rejected",
    disposition: "reject",
    ownerIssue: "#113",
    residual: false,
    notes: "Production ingress must not be local serve",
  },
] as const satisfies readonly AscCanonicalMapRow[];

export const APPLE_ASC_CANONICAL_MAP_REQUIRED_OP_CLASSES = ASC_OP_CLASSES;

export const APPLE_ASC_PROTECTED_EFFECTS: readonly AscEffectClass[] = ["publish", "credential", "create"] as const;

export const APPLE_ASC_DISTINCT_EVIDENCE_NOTE = "fixture ≠ sandbox-held ≠ testflight-held ≠ review-held ≠ production-held" as const;

/** Flags that never grant authority (KTD-113-8 / ADR-0013). */
export const ASC_NON_AUTHORITY_FLAGS = ["--yes", "--non-interactive", "--noninteractive", "-y"] as const;

export function getAppleAscCanonicalMap(): readonly AscCanonicalMapRow[] {
  return APPLE_ASC_CANONICAL_MAP;
}

export function appleAscCanonicalMapRow(id: string): AscCanonicalMapRow {
  const row = APPLE_ASC_CANONICAL_MAP.find((entry) => entry.id === id);
  if (!row) throw new Error(`unknown Apple ASC canonical map id: ${id}`);
  return row;
}

export function appleAscRowsForOpClass(opClass: AscOpClass): readonly AscCanonicalMapRow[] {
  return APPLE_ASC_CANONICAL_MAP.filter((row) => row.opClass === opClass);
}

export function appleAscRowsForEvidenceClass(evidenceClass: AscEvidenceClass): readonly AscCanonicalMapRow[] {
  return APPLE_ASC_CANONICAL_MAP.filter((row) => row.evidenceClass === evidenceClass);
}

export function appleAscProtectedRows(): readonly AscCanonicalMapRow[] {
  return APPLE_ASC_CANONICAL_MAP.filter(
    (row) => row.authorityClass === "founder-protected" || row.authorityClass === "rejected" || APPLE_ASC_PROTECTED_EFFECTS.includes(row.effectClass),
  );
}

/**
 * `--yes` / noninteractive never grants authority for protected ASC effects.
 * Returns false when a caller tries to treat those flags as permission.
 */
export function ascNoninteractiveGrantsAuthority(_flags: readonly string[]): false {
  return false;
}

export function ascFlagLooksNoninteractive(flag: string): boolean {
  const normalized = flag.trim().toLowerCase();
  return (ASC_NON_AUTHORITY_FLAGS as readonly string[]).includes(normalized);
}

export function evidenceClassesRemainDistinct(classes: readonly AscEvidenceClass[]): boolean {
  const unique = new Set(classes);
  return unique.size === classes.length && ASC_EVIDENCE_CLASSES.every((c) => unique.has(c));
}

/** Media (#38) must not be a graph prerequisite of broad asc-cli-automation. */
export const APPLE_STORE_MEDIA_STANDING_ENVELOPE = "workflow.store.apple-store-media-standing-envelope" as const;
export const ASC_CLI_AUTOMATION_WORKFLOW = "workflow.store.asc-cli-automation" as const;

export function mediaIsPrerequisiteOfAscCliAutomation(dependenciesOfAscCliAutomation: readonly string[]): boolean {
  return dependenciesOfAscCliAutomation.includes(APPLE_STORE_MEDIA_STANDING_ENVELOPE);
}
