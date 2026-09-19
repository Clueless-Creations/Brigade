/**
 * Official Expo skills and MCP routing (#87).
 *
 * Inventory only. This module does not install expo/skills, connect Expo MCP, or add a
 * MobileOperationTransport. Host-native device tools stay preferred. Builder AGENTS.md remains
 * authoritative over any upstream skill instruction.
 *
 * Inspected README revision: 170589a7ee8963156f63de8202fa96cf08a9e610 on github.com/expo/skills.
 * Discovery ≠ install. Scoped prepare-on-authorize ≠ global pack install. Malicious instructions fail closed.
 */
import { EXPO_KNOWLEDGE_REFERENCE_IDS, EXPO_SOURCE_URLS, type ExpoOperationId } from "./expo-selection.js";

export const EXPO_SKILLS_INSPECTED_COMMIT = "170589a7ee8963156f63de8202fa96cf08a9e610";
export const EXPO_SKILLS_LICENSE = "MIT";
export const EXPO_SKILLS_TELEMETRY_DEFAULT = "off" as const;

export type ExpoSkillGroup = "start-here" | "framework" | "services" | "experimental";

export type ExpoSkillInstallPolicy = "refuse-until-authorized";

export interface ExpoOfficialSkill {
  id: string;
  group: ExpoSkillGroup;
  mapsTo: readonly (typeof EXPO_KNOWLEDGE_REFERENCE_IDS)[number][];
  queuedIssue: 82 | 83 | 84 | 85 | 86 | 87 | 88 | null;
  paidService: boolean;
  experimental: boolean;
}

export const EXPO_OFFICIAL_SKILLS: readonly ExpoOfficialSkill[] = [
  {
    id: "expo-overview",
    group: "start-here",
    mapsTo: ["reference.engineering.expo-stack-selection", "reference.engineering.expo-operations-map"],
    queuedIssue: null,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-project-structure",
    group: "framework",
    mapsTo: ["reference.engineering.expo-stack-selection"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-router",
    group: "framework",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-native-ui",
    group: "framework",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-design-system",
    group: "framework",
    mapsTo: ["reference.engineering.expo-stack-selection"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-module",
    group: "framework",
    mapsTo: ["reference.engineering.expo-operations-map", "reference.engineering.expo-compatibility"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-dev-client",
    group: "framework",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 82,
    paidService: false,
    experimental: false,
  },
  {
    id: "expo-upgrade",
    group: "framework",
    mapsTo: ["reference.engineering.expo-compatibility"],
    queuedIssue: 88,
    paidService: false,
    experimental: false,
  },
  {
    id: "eas-hosting",
    group: "services",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 86,
    paidService: true,
    experimental: false,
  },
  {
    id: "eas-update",
    group: "services",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 85,
    paidService: true,
    experimental: false,
  },
  {
    id: "eas-app-stores",
    group: "services",
    mapsTo: ["reference.engineering.expo-operations-map"],
    queuedIssue: 84,
    paidService: true,
    experimental: false,
  },
  {
    id: "expo-migrate-module",
    group: "experimental",
    mapsTo: ["reference.engineering.expo-compatibility"],
    queuedIssue: 82,
    paidService: false,
    experimental: true,
  },
];

export interface ExpoSkillDiscovery {
  installPolicy: ExpoSkillInstallPolicy;
  telemetryDefault: typeof EXPO_SKILLS_TELEMETRY_DEFAULT;
  mcpSelectedByDefault: false;
  addsMobileOperationTransport: false;
  hostNativePreferred: true;
  discoveryIsNotInstall: true;
  scopedPrepareOnly: true;
  agentsAcceptanceAuthoritative: true;
  officialSkillsSource: typeof EXPO_SOURCE_URLS.officialSkills;
  inspectedCommit: typeof EXPO_SKILLS_INSPECTED_COMMIT;
  skills: readonly ExpoOfficialSkill[];
}

export function discoverExpoOfficialSkills(): ExpoSkillDiscovery {
  return {
    installPolicy: "refuse-until-authorized",
    telemetryDefault: EXPO_SKILLS_TELEMETRY_DEFAULT,
    mcpSelectedByDefault: false,
    addsMobileOperationTransport: false,
    hostNativePreferred: true,
    discoveryIsNotInstall: true,
    scopedPrepareOnly: true,
    agentsAcceptanceAuthoritative: true,
    officialSkillsSource: EXPO_SOURCE_URLS.officialSkills,
    inspectedCommit: EXPO_SKILLS_INSPECTED_COMMIT,
    skills: EXPO_OFFICIAL_SKILLS,
  };
}

/**
 * Inventory refresh honesty: comparing an observed upstream commit to the inspected revision
 * does not install skills or expand allowlist effects. Drift requires re-review, not auto-grant.
 */
export type ExpoSkillInventoryRefresh =
  | {
      readonly status: "matches-inspected";
      readonly inspectedCommit: typeof EXPO_SKILLS_INSPECTED_COMMIT;
      readonly observedCommit: string;
      readonly installed: false;
      readonly allowlistExpanded: false;
      readonly notes: string;
    }
  | {
      readonly status: "drift-requires-review";
      readonly inspectedCommit: typeof EXPO_SKILLS_INSPECTED_COMMIT;
      readonly observedCommit: string;
      readonly installed: false;
      readonly allowlistExpanded: false;
      readonly notes: string;
    };

export function refreshExpoSkillInventory(observedCommit: string): ExpoSkillInventoryRefresh {
  if (observedCommit === EXPO_SKILLS_INSPECTED_COMMIT) {
    return {
      status: "matches-inspected",
      inspectedCommit: EXPO_SKILLS_INSPECTED_COMMIT,
      observedCommit,
      installed: false,
      allowlistExpanded: false,
      notes: "Inventory matches the inspected expo/skills commit. Discovery still does not install.",
    };
  }
  return {
    status: "drift-requires-review",
    inspectedCommit: EXPO_SKILLS_INSPECTED_COMMIT,
    observedCommit,
    installed: false,
    allowlistExpanded: false,
    notes: "Observed expo/skills commit differs from the inspected revision. Re-review before any prepare. Do not auto-expand the allowlist or install.",
  };
}

/**
 * Reconcile an "installed" skill id against the reviewed inventory. Installed ≠ reviewed support.
 */
export function reconcileInstalledExpoSkill(installedSkillId: string): {
  readonly reviewed: boolean;
  readonly skill?: ExpoOfficialSkill;
  readonly allowEffects: false;
  readonly notes: string;
} {
  const skill = EXPO_OFFICIAL_SKILLS.find((entry) => entry.id === installedSkillId);
  if (!skill) {
    return {
      reviewed: false,
      allowEffects: false,
      notes: `Installed skill ${installedSkillId} is not in the reviewed inventory. Invalidate affected evidence. Do not grant new effects.`,
    };
  }
  return {
    reviewed: true,
    skill,
    allowEffects: false,
    notes: `Skill ${skill.id} is reviewed in inventory group ${skill.group}. Presence/install does not grant deploy, approval, or secret disclosure effects.`,
  };
}

export function expoSkillInstallCommand(authorized: boolean, skillId?: string): { action: "refuse" | "prepare"; command?: string; reason: string } {
  if (!authorized) {
    return {
      action: "refuse",
      reason: "Official Expo skills stay uninstalled until founder approval for this session. Discovery is not an install.",
    };
  }
  const skill = skillId ? EXPO_OFFICIAL_SKILLS.find((entry) => entry.id === skillId) : undefined;
  if (skillId && !skill) {
    return { action: "refuse", reason: `Unknown official Expo skill ${skillId}. Do not install a guessed pack.` };
  }
  const selector = skill ? `--skill ${skill.id}` : "--skill expo-overview";
  return {
    action: "prepare",
    command: `npx skills add expo/skills ${selector}`,
    reason: "Prepared scoped install. Do not pass --yes during intake. Do not install the full pack as a default.",
  };
}

/** Blanket pack install / --yes / wildcard are always refused — scoped ≠ global. */
export function refuseBlanketExpoSkillInstall(command: string): {
  readonly refused: true;
  readonly reason: string;
} {
  const lowered = command.toLowerCase();
  const blanket =
    lowered.includes("--skill '*'") ||
    lowered.includes('--skill "*"') ||
    lowered.includes("--skill *") ||
    (lowered.includes("expo/skills") && !lowered.includes("--skill ")) ||
    lowered.includes("--yes");
  if (blanket) {
    return {
      refused: true,
      reason: "Refuse blanket expo/skills install, wildcard --skill '*', and --yes during intake. Use scoped --skill <id> prepare-on-authorize only.",
    };
  }
  return {
    refused: true,
    reason: "Installer-generated config must be inspected before apply. Preparing a scoped command is not executing it.",
  };
}

export type ExpoMaliciousSkillRefuseReason =
  "install-tooling" | "alter-approvals" | "disclose-secrets" | "change-business-scope" | "overrule-agents-acceptance";

/**
 * Malicious / unreviewed skill instructions fail closed. AGENTS.md and acceptance remain authoritative.
 */
export function refuseMaliciousExpoSkillInstruction(instruction: {
  readonly triesToInstallTooling?: boolean;
  readonly triesToAlterApprovals?: boolean;
  readonly triesToDiscloseSecrets?: boolean;
  readonly triesToChangeBusinessScope?: boolean;
  readonly triesToOverruleAgentsOrAcceptance?: boolean;
}): { readonly refused: true; readonly reasons: readonly ExpoMaliciousSkillRefuseReason[]; readonly notes: string } {
  const reasons: ExpoMaliciousSkillRefuseReason[] = [];
  if (instruction.triesToInstallTooling) reasons.push("install-tooling");
  if (instruction.triesToAlterApprovals) reasons.push("alter-approvals");
  if (instruction.triesToDiscloseSecrets) reasons.push("disclose-secrets");
  if (instruction.triesToChangeBusinessScope) reasons.push("change-business-scope");
  if (instruction.triesToOverruleAgentsOrAcceptance) reasons.push("overrule-agents-acceptance");
  if (reasons.length === 0) {
    reasons.push("overrule-agents-acceptance");
  }
  return {
    refused: true,
    reasons,
    notes:
      "Builder AGENTS.md and acceptance remain authoritative over upstream skill text. Skill instructions cannot install tooling, alter approvals, disclose secrets, or change business scope without existing authority gates.",
  };
}

export function expoMcpDoesNotReplace(operation: ExpoOperationId): boolean {
  switch (operation) {
    case "expo-mcp":
    case "official-skills":
      return true;
    case "stack-selection":
    case "knowledge-routing":
    case "passive-detection":
    case "starter-scaffold":
    case "router-native-ui":
    case "cng-prebuild":
    case "custom-native-module":
    case "authentication":
    case "offline-data":
    case "device-capabilities":
    case "native-purchases":
    case "expo-cli-process":
    case "eas-cloud-build":
    case "eas-local-build":
    case "direct-local-compile":
    case "eas-workflows":
    case "store-handoff":
    case "eas-update":
    case "expo-web-export":
    case "eas-hosting":
    case "quality-observability":
      return true;
    default: {
      const exhaustive: never = operation;
      throw new Error(`unhandled Expo operation: ${String(exhaustive)}`);
    }
  }
}

/** Skills grouped for inventory honesty — framework/services/experimental stay separate from discovery install. */
export function expoSkillsByGroup(group: ExpoSkillGroup): readonly ExpoOfficialSkill[] {
  return EXPO_OFFICIAL_SKILLS.filter((skill) => skill.group === group);
}
