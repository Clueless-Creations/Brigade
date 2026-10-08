// Social cards, discovery, the web-to-app funnel, and deep links.
export const id = "web-surface";
export const describe = "Social cards, discovery, funnel, and deep links.";

const RASTER = /\.(png|jpe?g)$/iu;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function raster(value) {
  const path = value.split("?")[0]?.trim() ?? "";
  return RASTER.test(path);
}

function pageImage(page, meta) {
  return text(page?.og_image) || text(meta?.og_image);
}

export function resolvedOrigin(spec) {
  const named = text(spec.discovery?.canonical_origin);
  if (named) return { origin: named, source: "discovery.canonical_origin" };
  const fallback = text(spec.meta?.web_origin);
  if (fallback) return { origin: fallback, source: "meta.web_origin" };
  return { origin: "", source: "" };
}

export function check(spec, ctx) {
  const errors = [];
  const meta = spec.web_meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    errors.push("web_meta: missing");
  } else {
    for (const key of ["site_name", "title_pattern", "default_description", "og_image", "theme_color", "x_card"]) {
      if (!text(meta[key])) errors.push(`web_meta: ${key} is missing`);
    }
    if (text(meta.og_image) && !raster(text(meta.og_image))) errors.push("web_meta: og_image must be .png or .jpg");
    if (meta.og_image_width !== 1200 || meta.og_image_height !== 630) errors.push("web_meta: og_image must be 1200x630");
  }

  for (const page of spec.web ?? []) {
    const id = page?.id ?? "";
    if (!text(page?.title)) errors.push(`web: "${id}" is missing title`);
    if (!text(page?.description)) errors.push(`web: "${id}" is missing description`);
    const image = pageImage(page, meta && typeof meta === "object" ? meta : undefined);
    if (!image) errors.push(`web: "${id}" og_image is missing`);
    else if (!raster(image)) errors.push(`web: "${id}" og_image must be .png or .jpg`);
  }

  const discovery = spec.discovery;
  if (!discovery || typeof discovery !== "object" || Array.isArray(discovery)) {
    errors.push("discovery: missing");
  } else if (!Array.isArray(discovery.faq) || discovery.faq.length === 0) {
    errors.push("discovery: FAQ is missing");
  } else {
    discovery.faq.forEach((entry, index) => {
      if (!text(entry?.question) || !text(entry?.answer)) {
        errors.push(`discovery: FAQ entry ${index + 1} needs a question and an answer`);
      }
    });
  }

  const funnel = spec.funnel;
  if (!funnel || typeof funnel !== "object" || Array.isArray(funnel)) {
    errors.push("funnel: missing");
  } else {
    if (!Array.isArray(funnel.channels) || funnel.channels.length === 0) errors.push("funnel: channels are missing");
    else {
      for (const channel of funnel.channels) {
        const id = text(channel?.id) || "(unnamed)";
        if (!text(channel?.landing_path)) errors.push(`funnel: "${id}" is missing landing_path`);
        if (!text(channel?.ct)) errors.push(`funnel: "${id}" is missing ct`);
        if (channel?.fallback !== "static_href") errors.push(`funnel: "${id}" needs a static href fallback`);
      }
    }
    if (!text(funnel.smart_app_banner?.app_argument)) errors.push("funnel: smart_app_banner app-argument is missing");
  }

  const webPaths = new Set((spec.web ?? []).map((page) => page?.path).filter((path) => typeof path === "string"));
  const routes = spec.deep_links?.routes;
  if (Array.isArray(routes)) {
    for (const route of routes) {
      const path = text(route?.path) || "(unnamed)";
      const screen = route?.screen;
      if (!ctx.screenIds.has(screen)) errors.push(`deep_links: "${path}" names unknown screen "${screen ?? ""}"`);
      const fallback = route?.web_fallback;
      if (typeof fallback !== "string" || !webPaths.has(fallback)) {
        errors.push(`deep_links: "${path}" names unknown web fallback "${fallback ?? ""}"`);
      }
    }
  }
  return errors;
}
