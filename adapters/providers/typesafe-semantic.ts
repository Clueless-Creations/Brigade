/**
 * Shared TypeSafe semantic surface for protected kernel/catalog importers (#571).
 *
 * ARCH-03/04 allow flat `adapters/providers/*.ts` shared catalog modules, but forbid
 * protected surfaces from importing nested provider-native trees
 * (`adapters/providers/typesafe/...`). Kernel services that need the paper
 * encode/decode/selection helpers must import this module — never the nested
 * adapter index — so provider identity stays swappable at the composition edge.
 *
 * Does not add a second Jev/TypeSafe runtime. Live spend is not performed here.
 * Paired with skill-version.json on CI fix commits (version_discipline.manifest_not_latest).
 */
export {
  TYPESAFE_ADAPTER_BINDING_ID,
  TYPESAFE_ADAPTER_PROVIDER_ID,
  TYPESAFE_ADAPTER_STAMP,
  TYPESAFE_SYSTEMONE_PATH,
  decodeTypesafeResponse,
  encodeTypesafeRequest,
  mapTypesafeHttpStatus,
  resolveTypesafeAvailability,
  typesafeSupportDeclaration,
  TYPESAFE_SELECTED_BINDING,
  type TypesafeAvailability,
  type TypesafeDecodeResult,
  type TypesafeSelectionInput,
  type TypesafeSupportDeclaration,
} from "./typesafe/index.js";
