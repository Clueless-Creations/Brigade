/**
 * EAS Update identity map (#85).
 *
 * Build ≠ update. Published ≠ applied. User-visible app version ≠ runtimeVersion ≠
 * native runtime fingerprint ≠ update group/branch/channel ≠ client-observed update ID.
 * Documents and asserts distinctness only — does not spawn or publish.
 */

export const EXPO_UPDATE_IDENTITY_PATH = "adapters/providers/expo/update-identity.ts" as const;

export type ExpoUpdatePlatform = "ios" | "android";

export interface ExpoUpdateIdentityMap {
  readonly expoAppId: string;
  readonly easProjectId: string;
  readonly platform: ExpoUpdatePlatform;
  readonly buildProfile: string;
  readonly environment: string;
  readonly nativeRuntimeFingerprint: string;
  readonly appVersion: string;
  readonly runtimeVersion: string;
  readonly binaryId: string;
  readonly updateBranch: string;
  readonly updateChannel: string;
  readonly updateGroupId: string;
  readonly publishedUpdateId: string;
  readonly clientObservedUpdateId: string;
}

export type ExpoUpdateIdentityRole =
  | "expo-app"
  | "eas-project"
  | "platform"
  | "build-profile"
  | "environment"
  | "native-runtime-fingerprint"
  | "app-version"
  | "runtime-version"
  | "binary"
  | "update-branch"
  | "update-channel"
  | "update-group"
  | "published-update"
  | "client-observed-update";

export const EXPO_UPDATE_IDENTITY_ROLES: readonly ExpoUpdateIdentityRole[] = [
  "expo-app",
  "eas-project",
  "platform",
  "build-profile",
  "environment",
  "native-runtime-fingerprint",
  "app-version",
  "runtime-version",
  "binary",
  "update-branch",
  "update-channel",
  "update-group",
  "published-update",
  "client-observed-update",
] as const;

export const EXPO_UPDATE_IDENTITY_NOTES = {
  buildIsNotUpdate: "A finished EAS Build binary is not an EAS Update. Binary id ≠ update id.",
  publishedIsNotApplied: "Server publishedUpdateId is not clientObservedUpdateId. Publication ≠ application.",
  appVersionIsNotRuntime: "User-visible appVersion is not runtimeVersion and not nativeRuntimeFingerprint.",
  runtimeStringIsNotFingerprint: "Matching runtimeVersion alone is not compatibility when nativeRuntimeFingerprint moved.",
  channelIsNotBranch: "Update channel and update branch are distinct routing surfaces.",
  previewIsNotProduction: "Preview channel/environment must not be treated as production.",
} as const;

export interface ExpoUpdateIdentityDistinctness {
  readonly distinct: boolean;
  readonly collisions: readonly string[];
  readonly notes: readonly string[];
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function assertExpoUpdateIdentitiesDistinct(map: ExpoUpdateIdentityMap): ExpoUpdateIdentityDistinctness {
  const collisions: string[] = [];
  const pairs: Array<readonly [string, string, string]> = [
    ["binaryId", map.binaryId, map.publishedUpdateId],
    ["binaryId", map.binaryId, map.clientObservedUpdateId],
    ["publishedUpdateId", map.publishedUpdateId, map.clientObservedUpdateId],
    ["appVersion", map.appVersion, map.runtimeVersion],
    ["appVersion", map.appVersion, map.nativeRuntimeFingerprint],
    ["runtimeVersion", map.runtimeVersion, map.nativeRuntimeFingerprint],
    ["updateBranch", map.updateBranch, map.updateChannel],
    ["updateGroupId", map.updateGroupId, map.publishedUpdateId],
    ["easProjectId", map.easProjectId, map.expoAppId],
    ["buildProfile", map.buildProfile, map.updateChannel],
  ];

  for (const [leftLabel, left, right] of pairs) {
    if (nonEmpty(left) && nonEmpty(right) && left === right) {
      collisions.push(`${leftLabel} collides with peer value "${left}"`);
    }
  }

  return {
    distinct: collisions.length === 0,
    collisions,
    notes: [
      EXPO_UPDATE_IDENTITY_NOTES.buildIsNotUpdate,
      EXPO_UPDATE_IDENTITY_NOTES.publishedIsNotApplied,
      EXPO_UPDATE_IDENTITY_NOTES.appVersionIsNotRuntime,
      EXPO_UPDATE_IDENTITY_NOTES.runtimeStringIsNotFingerprint,
      EXPO_UPDATE_IDENTITY_NOTES.channelIsNotBranch,
      EXPO_UPDATE_IDENTITY_NOTES.previewIsNotProduction,
    ],
  };
}

export function claimsClientApplyFromPublishOnly(
  map: Pick<ExpoUpdateIdentityMap, "publishedUpdateId" | "clientObservedUpdateId">,
): boolean {
  return nonEmpty(map.publishedUpdateId) && !nonEmpty(map.clientObservedUpdateId);
}
