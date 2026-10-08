// CLU-108: store creative assets. A later lane adds checks/<NN>-<area>.mjs instead of editing 00-core.mjs.
export const id = "store-creative";
export const describe = "store.creative_assets includes a product-page header.";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProductPageHeader(asset) {
  if (!isRecord(asset)) return false;
  const placement = typeof asset.placement === "string" ? asset.placement.toLowerCase() : "";
  const id = typeof asset.id === "string" ? asset.id.toLowerCase() : "";
  return placement.includes("product-page header") || id === "product-page-header";
}

export function check(spec) {
  const assets = spec.store?.creative_assets;
  if (!Array.isArray(assets)) return ["store.creative_assets is missing"];
  if (!assets.some(isProductPageHeader)) return ["store.creative_assets has no product-page header"];
  return [];
}
