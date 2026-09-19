/**
 * #515 SQ-04 TypeSafe adapter — support / encode / transport / decode.
 * Paper close path: fixtures + fake transport. Live not performed.
 */
export {
  TYPESAFE_ADAPTER_ISSUE,
  TYPESAFE_ADAPTER_EPIC,
  TYPESAFE_ADAPTER_CONSUMES,
  TYPESAFE_ADAPTER_PROVIDER_ID,
  TYPESAFE_ADAPTER_BINDING_ID,
  TYPESAFE_ADAPTER_STAMP,
  TYPESAFE_SYSTEMONE_PATH,
  TYPESAFE_AVAILABILITY_STATES,
  TYPESAFE_IMPLEMENTED_CAPABILITIES,
  TYPESAFE_DEFERRED_CAPABILITIES,
  TYPESAFE_REJECTED_CAPABILITIES,
  typesafeSupportDeclaration,
  resolveTypesafeAvailability,
  typesafeCapabilityEmulationForbidden,
  typesafeDispositionCountsFromMap,
  type TypesafeAvailability,
  type TypesafeSupportDeclaration,
  type TypesafeSelectionInput,
} from "./support.js";

export { encodeTypesafeRequest, encodedQuestionIds, TypesafeEncodeError, type TypesafeNativeRequest, type TypesafeNativeQuestion } from "./encode.js";

export {
  decodeTypesafeResponse,
  mapTypesafeHttpStatus,
  type TypesafeNativeResponse,
  type TypesafeDecodeResult,
  type TypesafeDecodeSuccess,
  type TypesafeDecodeFailure,
  type TypesafeAnswerObservation,
} from "./decode.js";

export { resolveTypesafeConnection, readTypesafeApiKey, redactSecrets, type TypesafeConnectionEnv, type TypesafeResolvedConnection } from "./connection.js";

export {
  TYPESAFE_DEFAULT_EFFECTS,
  assertEndpointAllowed,
  assertRequestSize,
  assertResponseSize,
  deadlineExceededViolation,
  cancelledViolation,
  uncertainDispatchViolation,
  type TypesafeEffectsPolicy,
  type TypesafeEffectsViolation,
} from "./effects.js";

export {
  createFakeTypesafeTransport,
  createLiveTypesafeTransport,
  type TypesafeTransport,
  type FakeTypesafeTransport,
  type TypesafeTransportResult,
} from "./transport.js";

export {
  TYPESAFE_LIVE_NOT_PERFORMED,
  assessWithTypesafe,
  typesafePassiveCall,
  isFakeTypesafeTransport,
  typesafeConnectionSnapshot,
  type TypesafeAssessInput,
  type TypesafeAssessResult,
  type TypesafePassiveResult,
} from "./assess.js";

export { TYPESAFE_SELECTED_BINDING, typesafeSelectedBindingCoverage } from "./binding.js";
