/**
 * #515 minimal TypeSafe selected-binding coverage.
 * Coordinates with #109 provider architecture ownership — does not replace it.
 * Declares the assessment binding id and selection semantics only.
 */
import {
  TYPESAFE_ADAPTER_BINDING_ID,
  TYPESAFE_ADAPTER_PROVIDER_ID,
  TYPESAFE_ADAPTER_STAMP,
  TYPESAFE_ADAPTER_ISSUE,
  TYPESAFE_ADAPTER_EPIC,
  TYPESAFE_IMPLEMENTED_CAPABILITIES,
  TYPESAFE_DEFERRED_CAPABILITIES,
  TYPESAFE_REJECTED_CAPABILITIES,
  typesafeSupportDeclaration,
} from "./support.js";
import { TYPESAFE_TRANSPORT_RECOMMENDATION, TYPESAFE_LIVE_NOT_PERFORMED, TYPESAFE_HOSTED_KEY_OWNER } from "../../../catalog/providers/typesafe-qualify-map.js";

export const TYPESAFE_SELECTED_BINDING = Object.freeze({
  bindingId: TYPESAFE_ADAPTER_BINDING_ID,
  providerId: TYPESAFE_ADAPTER_PROVIDER_ID,
  issue: TYPESAFE_ADAPTER_ISSUE,
  epic: TYPESAFE_ADAPTER_EPIC,
  architectureOwnerIssue: "#109",
  stamp: TYPESAFE_ADAPTER_STAMP,
  transport: TYPESAFE_TRANSPORT_RECOMMENDATION,
  operation: "semantic-assessment/systemone",
  authorityClass: "selected-binding" as const,
  implementedCapabilities: TYPESAFE_IMPLEMENTED_CAPABILITIES,
  deferredCapabilities: TYPESAFE_DEFERRED_CAPABILITIES,
  rejectedCapabilities: TYPESAFE_REJECTED_CAPABILITIES,
  liveNotPerformed: TYPESAFE_LIVE_NOT_PERFORMED,
  hostedKeyOwner: TYPESAFE_HOSTED_KEY_OWNER,
  /** Selection is host-explicit; detection of SDK/env alone never auto-selects. */
  autoSelectForbidden: true,
  /** #109 remains owner of general provider architecture — this is coverage only. */
  doesNotReplaceProviderArchitecture: true,
});

export function typesafeSelectedBindingCoverage(): typeof TYPESAFE_SELECTED_BINDING {
  // Touch support declaration so binding stays aligned with adapter stamp.
  const support = typesafeSupportDeclaration();
  if (support.bindingId !== TYPESAFE_SELECTED_BINDING.bindingId) {
    throw new Error("typesafe_binding_support_mismatch");
  }
  return TYPESAFE_SELECTED_BINDING;
}
