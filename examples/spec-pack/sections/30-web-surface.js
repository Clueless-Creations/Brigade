window.SPEC_SECTIONS.push({
  id: "web-surface",
  title: "Web surface",
  render(spec) {
    const meta = spec.web_meta ?? {};
    const landing = (spec.web ?? []).find((page) => page.id === "landing") ?? (spec.web ?? [])[0];
    const image = (landing && String(landing.og_image || "").trim()) || String(meta.og_image || "").trim();
    const named = spec.discovery && String(spec.discovery.canonical_origin || "").trim();
    const fromMeta = spec.meta && String(spec.meta.web_origin || "").trim();
    const origin = named || fromMeta || "";
    const originSource = named ? "discovery.canonical_origin" : fromMeta ? "meta.web_origin" : "";
    const card = landing
      ? `<div class="web" id="social-landing"><div class="chrome"><i></i><i></i><i></i> Social card · landing</div><div class="pg"><div class="sec" style="min-height:120px;display:flex;align-items:flex-end;background:${esc(meta.theme_color || "#ddd")}"><div><b>${esc(landing.title)}</b><div>${esc(landing.description)}</div><div>${esc(image)} · ${esc(meta.og_image_width)}×${esc(meta.og_image_height)} · ${esc(meta.x_card)}</div></div></div></div></div>`
      : `<p class="sub">No landing page to preview.</p>`;
    const channels = Array.isArray(spec.funnel?.channels) ? spec.funnel.channels : [];
    const channelRows = channels
      .map(
        (channel) =>
          `<tr><td><code>${esc(channel.id)}</code></td><td><code>${esc(channel.landing_path)}</code></td><td><code>${esc(channel.ct)}</code></td><td>${esc(channel.fallback)}</td></tr>`,
      )
      .join("");
    const banner = spec.funnel?.smart_app_banner;
    const bannerLine = banner
      ? `<p class="sub">Smart App Banner <code>${esc(banner.meta_name)}</code> app-argument <code>${esc(banner.app_argument)}</code></p>`
      : "";
    const routes = Array.isArray(spec.deep_links?.routes) ? spec.deep_links.routes : [];
    const routeRows = routes
      .map(
        (route) =>
          `<tr><td><code>${esc(route.path)}</code></td><td><code>${esc(route.screen)}</code></td><td><code>${esc(route.web_fallback)}</code></td></tr>`,
      )
      .join("");
    const matrix = Array.isArray(spec.deep_links?.test_matrix) ? spec.deep_links.test_matrix.map((item) => esc(item)).join(", ") : "";
    return [
      `<p class="sub">Canonical origin <code>${esc(origin || "unset")}</code>${originSource ? ` from <code>${esc(originSource)}</code>` : ""}.</p>`,
      `<div class="flowlabel">Landing social card</div>`,
      card,
      `<div class="flowlabel">Funnel channels</div>`,
      bannerLine,
      `<table><tr><th>Channel</th><th>Landing path</th><th>ct</th><th>Fallback</th></tr>${channelRows}</table>`,
      `<div class="flowlabel">Deep links</div>`,
      `<table><tr><th>Path</th><th>Screen</th><th>Web fallback</th></tr>${routeRows}</table>`,
      matrix ? `<p class="sub">Test matrix: ${matrix}.</p>` : "",
    ].join("");
  },
});
