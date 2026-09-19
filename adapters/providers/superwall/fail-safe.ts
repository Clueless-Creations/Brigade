/**
 * Superwall fail-safe classification (#114 / ADR-0013).
 *
 * Deterministic rules for drift, missing placement/config, stale campaign,
 * account/project mismatch, offline/cache, purchase delegation failure,
 * competing entitlement authority, and partial analytics — without live
 * Superwall account, campaign publish, or production paywall mutation.
 *
 * KTD-114-5: delegation failures fail closed / safe — no silent fallback that
 * grants access or invents campaign state. Presentation ≠ purchase ≠ entitlement.
 * `--yes` never grants authority.
 */

import {
  SUPERWALL_NON_AUTHORITY_FLAGS,
  superwallFlagLooksNoninteractive,
  superwallNoninteractiveGrantsAuthority,
  type SuperwallOpClass,
} from "../../../catalog/providers/superwall-canonical-map.js";

export type SuperwallFailSafeAction =
  | "fail-closed"
  | "hold-stale"
  | "hold-offline"
  | "hold-partial-analytics"
  | "refuse-competing-authority"
  | "refuse-delegation-failure"
  | "idle-unselected"
  | "proceed-observe";

export interface SuperwallTarget {
  readonly appId: string;
  readonly superwallProjectId?: string;
  readonly environment?: string;
  readonly accountId?: string;
}

export interface SuperwallFailSafeEvent {
  readonly opClass: SuperwallOpClass;
  readonly versionDrift: boolean;
  readonly schemaDrift: boolean;
  readonly missingPlacementOrConfig: boolean;
  readonly staleCampaign: boolean;
  readonly targetMatchesMandate: boolean;
  readonly offlineOrCacheOnly: boolean;
  readonly purchaseDelegationFailed: boolean;
  readonly competingEntitlementAuthority: boolean;
  readonly partialAnalytics: boolean;
  readonly superwallSelected: boolean;
  readonly authorityGranted: boolean;
  readonly noninteractiveFlags?: readonly string[];
}

export interface SuperwallFailSafeDecision {
  readonly action: SuperwallFailSafeAction;
  readonly allowAccessGrant: boolean;
  readonly allowCampaignInvent: boolean;
  readonly reason: string;
}

export function classifySuperwallFailSafe(event: SuperwallFailSafeEvent): SuperwallFailSafeDecision {
  const flags = event.noninteractiveFlags ?? [];
  if (flags.some(superwallFlagLooksNoninteractive) && !event.authorityGranted) {
    void superwallNoninteractiveGrantsAuthority(flags);
    return {
      action: "fail-closed",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "noninteractive-flags-do-not-grant-authority",
    };
  }
  void superwallNoninteractiveGrantsAuthority(flags);

  if (!event.superwallSelected) {
    return {
      action: "idle-unselected",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "unselected-superwall-idle",
    };
  }

  if (!event.targetMatchesMandate) {
    return {
      action: "fail-closed",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "account-project-mismatch",
    };
  }

  if (event.competingEntitlementAuthority) {
    return {
      action: "refuse-competing-authority",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "presentation-ne-purchase-ne-entitlement",
    };
  }

  if (event.purchaseDelegationFailed) {
    return {
      action: "refuse-delegation-failure",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "purchase-delegation-failed-no-access",
    };
  }

  if (event.versionDrift || event.schemaDrift) {
    return {
      action: "fail-closed",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: event.versionDrift ? "version-schema-drift" : "schema-drift",
    };
  }

  if (event.missingPlacementOrConfig) {
    return {
      action: "fail-closed",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "missing-placement-or-config",
    };
  }

  if (event.staleCampaign) {
    return {
      action: "hold-stale",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "stale-campaign-no-invent",
    };
  }

  if (event.offlineOrCacheOnly) {
    return {
      action: "hold-offline",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "offline-or-cache-only",
    };
  }

  if (event.partialAnalytics) {
    return {
      action: "hold-partial-analytics",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: "partial-analytics-incomplete",
    };
  }

  return {
    action: "proceed-observe",
    allowAccessGrant: false,
    allowCampaignInvent: false,
    reason: "observe-ok",
  };
}

export function targetsMatch(mandate: SuperwallTarget, candidate: SuperwallTarget): boolean {
  if (mandate.appId !== candidate.appId) return false;
  if (mandate.superwallProjectId !== undefined && mandate.superwallProjectId !== candidate.superwallProjectId) return false;
  if (mandate.environment !== undefined && mandate.environment !== candidate.environment) return false;
  if (mandate.accountId !== undefined && mandate.accountId !== candidate.accountId) return false;
  return true;
}

export function classifyWrongSuperwallTarget(opClass: SuperwallOpClass, mandate: SuperwallTarget, candidate: SuperwallTarget): SuperwallFailSafeDecision {
  if (targetsMatch(mandate, candidate)) {
    return {
      action: "proceed-observe",
      allowAccessGrant: false,
      allowCampaignInvent: false,
      reason: `target-ok:${opClass}`,
    };
  }
  return {
    action: "fail-closed",
    allowAccessGrant: false,
    allowCampaignInvent: false,
    reason: "account-project-mismatch",
  };
}

export function classifyPurchaseDelegationFailure(): SuperwallFailSafeDecision {
  return classifySuperwallFailSafe({
    opClass: "purchase-delegation",
    versionDrift: false,
    schemaDrift: false,
    missingPlacementOrConfig: false,
    staleCampaign: false,
    targetMatchesMandate: true,
    offlineOrCacheOnly: false,
    purchaseDelegationFailed: true,
    competingEntitlementAuthority: false,
    partialAnalytics: false,
    superwallSelected: true,
    authorityGranted: true,
  });
}

export function classifyCompetingEntitlementAuthority(): SuperwallFailSafeDecision {
  return classifySuperwallFailSafe({
    opClass: "entitlement-observe",
    versionDrift: false,
    schemaDrift: false,
    missingPlacementOrConfig: false,
    staleCampaign: false,
    targetMatchesMandate: true,
    offlineOrCacheOnly: false,
    purchaseDelegationFailed: false,
    competingEntitlementAuthority: true,
    partialAnalytics: false,
    superwallSelected: true,
    authorityGranted: true,
  });
}

/** Restore result from PurchaseController never implies entitlement access. */
export function restoreImpliesEntitlement(): false {
  return false;
}

export function campaignPublishAllowedByYesFlag(_flags: readonly string[]): false {
  return false;
}

export { SUPERWALL_NON_AUTHORITY_FLAGS };
