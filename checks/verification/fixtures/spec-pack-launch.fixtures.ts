// Launch-domain and tracker-draft checks. Loaded by checks/verification/fixtures/run.ts.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

const MILESTONES = ["Build", "Dogfood", "Gate 2", "Launch", "Run"];
const AREA_LABELS = ["App", "Web", "Store & Marketing", "Growth", "Money", "Ops"];
const CAPABILITY_LABELS = ["Auth", "Privacy", "Security", "Deep links", "Discovery (SEO/AEO/GEO)", "Analytics", "Accessibility"];
const FREE_WEB_ORIGIN = "https://<slug>.<account>.workers.dev";
const EXAMPLE_WEB_ORIGIN = "https://soon-example.example";

type SpecDoc = {
  meta: { web_origin?: unknown; domain?: unknown; slug?: string };
  screens: Array<{ id: string; acceptance?: string[] }>;
  web: Array<{ id: string }>;
  store: { creative_assets: unknown[] };
  tasks?: unknown;
};

type DraftIssue = {
  key: string;
  title: string;
  project: string;
  milestone: string;
  area: string;
  capabilities: string[];
  blockers: string[];
  checklist: string[];
};

type TrackerDraft = {
  projects: Array<{ key: string; name: string; web_origin: string; domain: string | null }>;
  milestones: string[];
  labels: { area: string[]; capability: string[] };
  issues: DraftIssue[];
};

function runBuild(specPath: string, outPath: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function readDraft(dir: string): TrackerDraft {
  return JSON.parse(readFileSync(path.join(dir, "tracker-draft.json"), "utf8")) as TrackerDraft;
}

export function register(harness: Harness): void {
  harness.check("spec-pack example with no domain writes tracker-draft.json", () => {
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc;
    assert(!Object.prototype.hasOwnProperty.call(spec.meta, "domain"), "example spec must omit meta.domain");
    assert(spec.meta.web_origin === EXAMPLE_WEB_ORIGIN, "example spec must use the reserved example origin");
    const outDir = harness.makeTempDir("spec-pack-launch-example");
    const result = runBuild(path.join(exampleDir, "spec.yaml"), path.join(outDir, "index.html"));
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const draft = readDraft(outDir);
    const expectedCount = spec.screens.length + spec.web.length + spec.store.creative_assets.length + (Array.isArray(spec.tasks) ? spec.tasks.length : 0);
    assert(draft.projects.length === 1, `expected one project, got ${draft.projects.length}`);
    assert(draft.projects[0]?.key === spec.meta.slug, "project key must be meta.slug");
    assert(draft.projects[0]?.domain === null, "omitted domain must stay null in the draft");
    assert(draft.projects[0]?.web_origin === EXAMPLE_WEB_ORIGIN, "draft must keep the spec web_origin");
    assert(JSON.stringify(draft.milestones) === JSON.stringify(MILESTONES), `milestones ${JSON.stringify(draft.milestones)}`);
    assert(JSON.stringify(draft.labels.area) === JSON.stringify(AREA_LABELS), `area labels ${JSON.stringify(draft.labels.area)}`);
    assert(JSON.stringify(draft.labels.capability) === JSON.stringify(CAPABILITY_LABELS), `capability labels ${JSON.stringify(draft.labels.capability)}`);
    assert(draft.issues.length === expectedCount, `expected ${expectedCount} issues, got ${draft.issues.length}`);
    const welcome = draft.issues.find((issue) => issue.key === "S-welcome");
    const landing = draft.issues.find((issue) => issue.key === "W-landing");
    assert(welcome?.area === "App", "S-welcome must use the App label");
    assert(welcome?.milestone === "Build", "screen issues start on Build");
    assert(welcome?.blockers.length === 0, "derived screen tasks have no blockers");
    assert(welcome?.checklist.includes("No sign-in before first value."), "screen acceptance must become the checklist");
    assert(landing?.area === "Web", "W-landing must use the Web label");
    const html = readFileSync(path.join(outDir, "index.html"), "utf8");
    assert(!html.includes("\\u003c"), "generated review page must not emit a \\u003c escape");
    assert(html.includes(EXAMPLE_WEB_ORIGIN), "example origin must be a plain URL in the review page");
    assert(html.includes('id: "tracker"'), "tracker preview section was not injected");
    assert(html.includes("By milestone"), "tracker preview must count milestones");
    assert(html.includes("By label"), "tracker preview must count labels");
  });

  harness.check("spec-pack defaults web_origin when domain and web_origin are omitted", () => {
    const work = harness.makeTempDir("spec-pack-launch-default-origin");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc;
    delete spec.meta.domain;
    delete spec.meta.web_origin;
    writeSpec(specPath, spec);
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const draft = readDraft(work);
    assert(draft.projects[0]?.web_origin === FREE_WEB_ORIGIN, "missing web_origin must default to the free URL");
    assert(draft.projects[0]?.domain === null, "missing domain must stay null");
  });

  harness.check("spec-pack keeps an optional domain and declared capability labels", () => {
    const work = harness.makeTempDir("spec-pack-launch-labels");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc & {
      tasks: Array<Record<string, unknown>>;
    };
    spec.meta.domain = "<name>.example";
    spec.tasks = [
      {
        id: "ops-support",
        title: "Support address",
        area: "Ops",
        milestone: "Launch",
        depends_on: ["S-settings"],
        acceptance: ["The support address is in the binary only after the domain exists."],
        capabilities: ["Privacy", "Deep links"],
      },
    ];
    writeSpec(specPath, spec);
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const draft = readDraft(work);
    assert(draft.projects[0]?.domain === "<name>.example", "a set domain must be copied into the draft");
    const issue = draft.issues.find((item) => item.key === "ops-support");
    assert(issue !== undefined, "declared task must become an issue");
    assert(issue?.area === "Ops", "issue must keep the area label");
    assert(issue?.milestone === "Launch", "issue must keep a declared milestone");
    assert(JSON.stringify(issue?.capabilities) === JSON.stringify(["Privacy", "Deep links"]), "issue must keep capability labels");
    assert(JSON.stringify(issue?.blockers) === JSON.stringify(["S-settings"]), "dependencies must become blockers");
    assert(issue?.checklist[0] === "The support address is in the binary only after the domain exists.", "acceptance must become the checklist");
    assert(
      draft.issues.length === spec.screens.length + spec.web.length + spec.store.creative_assets.length + 1,
      "one issue per screen, web page, creative asset, and task",
    );
  });

  harness.check("spec-pack rejects a non-string domain and an unknown capability", () => {
    const work = harness.makeTempDir("spec-pack-launch-invalid");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc & {
      tasks: Array<Record<string, unknown>>;
    };
    spec.meta.domain = 4;
    spec.meta.web_origin = false;
    spec.tasks = [
      {
        id: "bad-cap",
        title: "Bad capability",
        area: "Ops",
        depends_on: [],
        acceptance: ["Listed."],
        capabilities: ["Not a label"],
      },
    ];
    writeSpec(specPath, spec);
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("meta.domain: must be a string when set"), `missing domain error\n${result.output}`);
    assert(result.output.includes("meta.web_origin: must be a string when set"), `missing web_origin error\n${result.output}`);
    assert(result.output.includes('tasks: "bad-cap" capability "Not a label" is not a tracker label'), `missing capability error\n${result.output}`);
  });

  harness.check("launch docs keep the free URL, domain limit, tracker mapping, and portfolio step", () => {
    const phases = readFileSync(path.join(skillRoot, "knowledge/process/launch-phases.md"), "utf8");
    const funnel = readFileSync(path.join(skillRoot, "knowledge/process/tool-recipes/funnel-domain-and-privacy.md"), "utf8");
    const pack = readFileSync(path.join(skillRoot, "knowledge/design/spec-pack.md"), "utf8");
    assert(phases.includes("Universal Links, the share-link host, and the support address."), "launch phases must limit domain blocking to the binary");
    assert(phases.includes("It never blocks the site, policies, or store URLs during build."), "launch phases must keep the site unblocked");
    assert(phases.includes("founder's portfolio site, if any (a workspace setting)"), "launch phases must include the portfolio-site step");
    assert(funnel.includes("Verify every page on `web_origin` before any custom domain work."), "funnel verification must use web_origin");
    assert(funnel.includes("Bind the custom domain later, as its own step."), "custom domain bind must be a later step");
    assert(pack.includes("## Tracker mapping"), "spec-pack must document tracker mapping");
    assert(pack.includes("founder's portfolio site, if any (a workspace setting)"), "Gate 1 handoff must include the portfolio-site item");
  });

  harness.check("spec-pack gitignore excludes tracker-draft.json", () => {
    const text = readFileSync(path.join(exampleDir, ".gitignore"), "utf8");
    assert(text.includes("tracker-draft.json"), ".gitignore must exclude tracker-draft.json");
  });

  harness.check("Gate 1 domain question, tracker count, and portfolio checklist stay generic", () => {
    const gate = readFileSync(path.join(exampleDir, "GATE1.md"), "utf8");
    assert(gate.includes("Not blocking; site goes live on the free URL."), "GATE1.md must say the domain does not block");
    assert(gate.includes("{tracker_draft_count}"), "GATE1.md must keep {tracker_draft_count}");
    assert(gate.includes("tracker-draft.json"), "GATE1.md must read the count from tracker-draft.json");
    assert(gate.includes("founder's portfolio site, if any (a workspace setting)"), "GATE1.md must include the portfolio-site item");
    assert(gate.includes('Refresh the "how we build" story.'), "GATE1.md must refresh the how-we-build story");
    assert(!/https?:\/\/(?!<)[a-z0-9.-]+\.[a-z]{2,}/i.test(gate), "GATE1.md must not contain a live hostname");
  });
}

function writeSpec(specPath: string, spec: unknown): void {
  writeFileSync(specPath, YAML.stringify(spec));
}
