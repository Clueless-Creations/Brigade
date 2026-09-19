/**
 * #87 official skills discovery / allowlist honesty. Deterministic only.
 * Discovery ≠ install. Scoped prepare-on-authorize. No live skill install.
 */
import {
  EXPO_OFFICIAL_SKILLS,
  EXPO_SKILLS_INSPECTED_COMMIT,
  discoverExpoOfficialSkills,
  expoSkillInstallCommand,
  expoSkillsByGroup,
  reconcileInstalledExpoSkill,
  refreshExpoSkillInventory,
  refuseBlanketExpoSkillInstall,
  refuseMaliciousExpoSkillInstruction,
} from "../../../catalog/stacks/expo-agent-tools.js";
import { assessExpoAgentPrivacy } from "../../../catalog/stacks/expo-agent-privacy.js";
import { EXPO_APP_RUNTIME, operationFor, resolveExpoSelection } from "../../../catalog/stacks/expo-selection.js";
import { assert, type Harness } from "./_harness.js";

export function register(harness: Harness): void {
  harness.check("expo-agent-tools: discovery ≠ install; scoped prepare; inventory refresh honesty", () => {
    const discovery = discoverExpoOfficialSkills();
    assert(discovery.discoveryIsNotInstall === true, "discovery must declare ≠ install");
    assert(discovery.scopedPrepareOnly === true, "scoped prepare only");
    assert(discovery.agentsAcceptanceAuthoritative === true, "AGENTS/acceptance authoritative");
    assert(discovery.installPolicy === "refuse-until-authorized", "refuse until authorized");
    assert(discovery.addsMobileOperationTransport === false, "no Expo MobileOperationTransport");
    assert(discovery.hostNativePreferred === true, "host-native preferred");
    assert(discovery.inspectedCommit === EXPO_SKILLS_INSPECTED_COMMIT, "inspected commit");
    assert(discovery.skills.length === EXPO_OFFICIAL_SKILLS.length, "inventory complete");
    assert(
      expoSkillsByGroup("framework").every((s) => s.group === "framework"),
      "groups stay separate",
    );
    assert(
      expoSkillsByGroup("services").some((s) => s.paidService),
      "paid services labeled",
    );
    assert(
      expoSkillsByGroup("experimental").every((s) => s.experimental),
      "experimental labeled",
    );

    const match = refreshExpoSkillInventory(EXPO_SKILLS_INSPECTED_COMMIT);
    assert(match.status === "matches-inspected" && match.installed === false && match.allowlistExpanded === false, match.notes);

    const drift = refreshExpoSkillInventory("deadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    assert(drift.status === "drift-requires-review" && drift.allowlistExpanded === false, drift.notes);

    const refused = expoSkillInstallCommand(false, "expo-router");
    assert(refused.action === "refuse" && refused.command === undefined, refused.reason);
    const prepared = expoSkillInstallCommand(true, "expo-router");
    assert(prepared.action === "prepare" && prepared.command === "npx skills add expo/skills --skill expo-router", prepared.reason);
    assert(!prepared.command?.includes("--yes"), "no --yes");

    const blanket = refuseBlanketExpoSkillInstall("npx skills add expo/skills --skill '*' --yes");
    assert(blanket.refused === true && blanket.reason.includes("blanket"), blanket.reason);

    const unknownInstalled = reconcileInstalledExpoSkill("not-a-real-skill");
    assert(unknownInstalled.reviewed === false && unknownInstalled.allowEffects === false, unknownInstalled.notes);
    const knownInstalled = reconcileInstalledExpoSkill("eas-update");
    assert(knownInstalled.reviewed === true && knownInstalled.allowEffects === false, knownInstalled.notes);
  });

  harness.check("expo-agent-tools: malicious instructions fail closed; AGENTS remain authoritative", () => {
    const malicious = refuseMaliciousExpoSkillInstruction({
      triesToInstallTooling: true,
      triesToAlterApprovals: true,
      triesToDiscloseSecrets: true,
      triesToChangeBusinessScope: true,
      triesToOverruleAgentsOrAcceptance: true,
    });
    assert(malicious.refused === true, "must refuse");
    assert(malicious.reasons.includes("install-tooling"), "install tooling");
    assert(malicious.reasons.includes("alter-approvals"), "alter approvals");
    assert(malicious.reasons.includes("disclose-secrets"), "disclose secrets");
    assert(malicious.reasons.includes("change-business-scope"), "change scope");
    assert(malicious.reasons.includes("overrule-agents-acceptance"), "overrule AGENTS");
    assert(malicious.notes.includes("AGENTS.md"), malicious.notes);
  });

  harness.check("expo-agent-tools: privacy disclosure; local ≠ zero-network; telemetry separate", () => {
    const secret = assessExpoAgentPrivacy({ surface: "screenshot-tree", containsSecret: true, usesSyntheticAccount: true });
    assert(secret.decision === "refuse-secret" && secret.mayLogOrPublish === false, secret.notes);

    const customer = assessExpoAgentPrivacy({ surface: "crash-report", containsCustomerRecord: true, usesSyntheticAccount: true });
    assert(customer.decision === "refuse-customer-record", customer.notes);

    const zeroNet = assessExpoAgentPrivacy({
      surface: "hosted-model-access",
      usesNetworkOrHostedModel: true,
      claimsZeroNetwork: true,
    });
    assert(zeroNet.decision === "refuse-zero-network-claim", zeroNet.notes);

    const telemetry = assessExpoAgentPrivacy({ surface: "telemetry", sideEffectOfSkillRead: true });
    assert(telemetry.decision === "refuse-side-effect", telemetry.notes);

    const feedback = assessExpoAgentPrivacy({ surface: "public-feedback", sideEffectOfSkillRead: true });
    assert(feedback.decision === "refuse-side-effect", feedback.notes);

    const synth = assessExpoAgentPrivacy({ surface: "screenshot-tree", usesSyntheticAccount: false });
    assert(synth.decision === "require-synthetic-account", synth.notes);

    const ok = assessExpoAgentPrivacy({
      surface: "screenshot-tree",
      usesSyntheticAccount: true,
      usesNetworkOrHostedModel: true,
    });
    assert(ok.decision === "allow-with-disclosure" && ok.disclosureRequired === true, ok.notes);
  });

  harness.check("expo-agent-tools: selection official-skills fixture-tested; install/live not-run", () => {
    const selected = resolveExpoSelection({ compositionTarget: { platform: "ios", runtime: EXPO_APP_RUNTIME } });
    const op = operationFor(selected, "official-skills");
    assert(op.evidenceTier === "fixture-tested", "official-skills advanced to fixture-tested");
    assert(op.queuedIssue === 87, "stays #87");
    assert(op.notes.includes("Install and live MCP not-run"), op.notes);
    assert(op.notes.includes("discovery≠install") || op.notes.includes("Discovery"), op.notes);
    assert(op.notes.includes("addsMobileOperationTransport stays false"), op.notes);
  });
}
