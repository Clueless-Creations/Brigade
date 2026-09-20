export const PRODUCT_PROFILE_API_VERSION = "product-profile/v1" as const;
export const INTENDED_PRODUCT_PROFILE_PATH = "product-profile/intended.json" as const;
export const PRODUCT_PROFILE_KINDS = [
  "entity", "system", "mechanic", "state", "surface", "transition", "journey", "event", "effect",
  "visual-foundation", "component", "navigation-pattern", "motion-family", "gesture-family", "feedback",
  "content-pattern", "technical-characteristic",
] as const;
export type ProductProfileKind = (typeof PRODUCT_PROFILE_KINDS)[number];
