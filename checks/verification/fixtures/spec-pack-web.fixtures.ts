// Web-surface spec-pack checks: social cards, discovery, funnel, and deep links.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

type SpecDoc = {
  meta?: { web_origin?: string };
  web?: Array<Record<string, unknown>>;
  web_meta?: Record<string, unknown>;
  discovery?: Record<string, unknown>;
  funnel?: Record<string, unknown>;
  deep_links?: { routes?: Array<Record<string, unknown>> };
  tasks?: Array<{ id?: string; depends_on?: string[]; acceptance?: string[] }>;
  screens?: Array<{ id?: string }>;
};

function runBuild(specPath: string, outPath: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function loadExample(): SpecDoc {
  return YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc;
}

function writeSpec(dir: string, spec: SpecDoc): { specPath: string; outPath: string } {
  const specPath = path.join(dir, "spec.yaml");
  writeFileSync(specPath, YAML.stringify(spec));
  return { specPath, outPath: path.join(dir, "index.html") };
}

const POLISH_ORDER = [
  "knowledge/design/landing-motion-craft.md",
  "catalog/upstreams/amir-cinematic-scroll.yaml",
  "review-animations",
  "improve-animations",
  "knowledge/design/design-visual-system.md",
  "knowledge/design/vibecoded-tells.md",
  "knowledge/design/consumer-craft-benchmarks.md",
  "taste-skill",
  "impeccable",
  "knowledge/words/conversion-copy.md",
  "knowledge/words/no-slop-writing.md",
  "knowledge/words/consumer-copy-benchmarks.md",
  "knowledge/growth/geo-seo.md",
];

export function register(harness: Harness): void {
  harness.check("spec-pack web surface example passes and renders the card, tokens, and fallbacks", () => {
    const spec = loadExample();
    const discovery = spec.tasks?.find((task) => task.id === "W-DISCOVERY");
    const polish = spec.tasks?.find((task) => task.id === "W-POLISH");
    assert(discovery !== undefined, "example spec must include W-DISCOVERY");
    assert(Array.isArray(discovery.depends_on) && discovery.depends_on.length === 0, "W-DISCOVERY must have no dependencies");
    assert(polish !== undefined, "example spec must include W-POLISH");
    assert(polish.depends_on?.includes("W-landing") === true, "W-POLISH must depend on W-landing");
    const polishText = (polish.acceptance ?? []).join("\n");
    let cursor = -1;
    for (const marker of POLISH_ORDER) {
      const at = polishText.indexOf(marker);
      assert(at > cursor, `W-POLISH references are out of order at ${marker}`);
      cursor = at;
    }
    const landing = spec.web?.find((page) => page.id === "landing");
    const acceptance = Array.isArray(landing?.acceptance) ? landing.acceptance.join("\n") : "";
    for (const line of [
      "Reduced-motion check passes.",
      "Content stays readable without JavaScript.",
      "npx impeccable detect reports zero high findings.",
      "The geo-seo.md section 4 copy scan is recorded in the pull request.",
    ]) {
      assert(acceptance.includes(line), `landing acceptance is missing ${line}`);
    }

    const outDir = harness.makeTempDir("spec-pack-web-ok");
    const built = runBuild(path.join(exampleDir, "spec.yaml"), path.join(outDir, "index.html"));
    assert(built.status === 0, `expected exit 0, got ${built.status}\n${built.output}`);
    const html = readFileSync(path.join(outDir, "index.html"), "utf8");
    assert(html.includes('id: "web-surface"'), "web surface section was not injected");
    const context: { window: { SPEC_SECTIONS: Array<{ id: string; render: (spec: SpecDoc) => string }> }; esc: (value: unknown) => string } = {
      window: { SPEC_SECTIONS: [] },
      esc: (value) => String(value ?? ""),
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(path.join(exampleDir, "sections/30-web-surface.js"), "utf8"), context);
    const section = context.window.SPEC_SECTIONS.find((item) => item.id === "web-surface");
    assert(section !== undefined, "web surface section did not register");
    const rendered = section.render(spec);
    assert(!String(spec.discovery?.canonical_origin ?? "").trim(), "example discovery.canonical_origin must stay unset");
    assert(rendered.includes("meta.web_origin"), "example origin must come from meta.web_origin");
    assert(rendered.includes('id="social-landing"'), "landing social card is missing");
    assert(rendered.includes("web/og/landing.png"), "landing og image is missing from the card");
    assert(rendered.includes(">organic<"), "organic campaign token is missing");
    assert(rendered.includes(">share<"), "share campaign token is missing");
    assert(rendered.includes("/event/*"), "event deep link is missing");
    assert(rendered.includes("event-detail"), "event deep link screen is missing");
    assert(rendered.includes("/support"), "settings deep link fallback is missing");

    const upstream = readFileSync(path.join(skillRoot, "catalog/upstreams/geo-seo-claude.yaml"), "utf8");
    assert(upstream.includes("spdx: MIT"), "geo-seo-claude must record the MIT license");
    assert(upstream.includes("989cae01e8ebbc42a9ec798eb9e7cb423f5ec89c"), "geo-seo-claude must pin the reviewed commit");
    for (const manifest of ["catalog/knowledge/growth/growth-geo-seo.yaml", "catalog/knowledge/engineering/engineering-external-skill-packs.yaml"]) {
      const text = readFileSync(path.join(skillRoot, manifest), "utf8");
      assert(text.includes("upstream_id: geo-seo-claude"), `${manifest} must map the upstream`);
      assert(text.includes("revision: 989cae01e8ebbc42a9ec798eb9e7cb423f5ec89c"), `${manifest} must pin the reviewed commit`);
    }
  });

  harness.check("spec-pack web surface fails with a named error for each missing contract", () => {
    const cases: Array<{ name: string; mutate: (spec: SpecDoc) => void; error: string }> = [
      {
        name: "web-meta",
        mutate: (spec) => {
          delete spec.web_meta;
        },
        error: "web_meta: missing",
      },
      {
        name: "discovery",
        mutate: (spec) => {
          delete spec.discovery;
        },
        error: "discovery: missing",
      },
      {
        name: "faq",
        mutate: (spec) => {
          spec.discovery = { ...(spec.discovery ?? {}), faq: [] };
        },
        error: "discovery: FAQ is missing",
      },
      {
        name: "og-image",
        mutate: (spec) => {
          const landing = spec.web?.find((page) => page.id === "landing");
          assert(landing !== undefined, "example spec must include a landing page");
          landing.og_image = "web/og/landing.svg";
        },
        error: 'web: "landing" og_image must be .png or .jpg',
      },
      {
        name: "title",
        mutate: (spec) => {
          const landing = spec.web?.find((page) => page.id === "landing");
          assert(landing !== undefined, "example spec must include a landing page");
          delete landing.title;
        },
        error: 'web: "landing" is missing title',
      },
      {
        name: "description",
        mutate: (spec) => {
          const landing = spec.web?.find((page) => page.id === "landing");
          assert(landing !== undefined, "example spec must include a landing page");
          delete landing.description;
        },
        error: 'web: "landing" is missing description',
      },
      {
        name: "funnel",
        mutate: (spec) => {
          delete spec.funnel;
        },
        error: "funnel: missing",
      },
      {
        name: "deep-link",
        mutate: (spec) => {
          const route = spec.deep_links?.routes?.find((item) => item.path === "/event/*");
          assert(route !== undefined, "example spec must include the event deep link");
          route.screen = "ghost-screen";
        },
        error: 'deep_links: "/event/*" names unknown screen "ghost-screen"',
      },
    ];

    for (const item of cases) {
      const spec = loadExample();
      item.mutate(spec);
      const paths = writeSpec(harness.makeTempDir(`spec-pack-web-${item.name}`), spec);
      const result = runBuild(paths.specPath, paths.outPath);
      assert(result.status === 1, `${item.name}: expected exit 1, got ${result.status}\n${result.output}`);
      assert(result.output.includes(item.error), `${item.name}: missing ${item.error}\n${result.output}`);
    }
  });

  harness.check("spec-pack discovery canonical origin defaults to meta.web_origin", () => {
    const spec = loadExample();
    assert(spec.discovery !== undefined, "example spec must include discovery");
    delete spec.discovery.canonical_origin;
    spec.meta = { ...(spec.meta ?? {}), web_origin: "https://<slug>.<account>.workers.dev" };
    const paths = writeSpec(harness.makeTempDir("spec-pack-web-origin"), spec);
    const result = runBuild(paths.specPath, paths.outPath);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const context: { window: { SPEC_SECTIONS: Array<{ id: string; render: (spec: SpecDoc) => string }> }; esc: (value: unknown) => string } = {
      window: { SPEC_SECTIONS: [] },
      esc: (value) => String(value ?? ""),
    };
    vm.createContext(context);
    vm.runInContext(readFileSync(path.join(exampleDir, "sections/30-web-surface.js"), "utf8"), context);
    const section = context.window.SPEC_SECTIONS.find((item) => item.id === "web-surface");
    assert(section !== undefined, "web surface section did not register");
    const rendered = section.render(spec);
    assert(rendered.includes("meta.web_origin"), `origin source was not the meta fallback\n${rendered}`);
  });
}
