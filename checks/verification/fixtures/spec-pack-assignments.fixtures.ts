import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

type Task = { id: string; title: string; area: string; depends_on: string[]; acceptance: string[]; source_refs?: string[] };
type Spec = {
  meta: Record<string, unknown>;
  screens: Array<{ id: string; states: string[]; mock: Record<string, unknown[]>; acceptance: string[] }>;
  repo: { merge_gate: string[] };
  store: { creative_assets: Array<Record<string, string>> };
  tasks: Task[];
};
type Issue = {
  key: string;
  checklist: string[];
  checklist_sources: string[];
  blockers: string[];
  source: { file: string; sha256: string };
  source_refs: string[];
  context: Array<{ source_ref: string; when: string; value: unknown }>;
};
type Draft = { source: { file: string; sha256: string; spec_version: unknown }; issues: Issue[] };
const example = path.join(skillRoot, "examples/spec-pack");

function run(harness: Harness, name: string, change: (spec: Spec) => void) {
  const dir = harness.makeTempDir(name);
  const spec = YAML.parse(readFileSync(path.join(example, "spec.yaml"), "utf8")) as Spec;
  change(spec);
  const source = YAML.stringify(spec);
  const input = path.join(dir, "approved.yaml");
  writeFileSync(input, source);
  const result = spawnSync(process.execPath, [path.join(example, "build.mjs"), input, path.join(dir, "index.html")], {
    encoding: "utf8",
    cwd: example,
  });
  return { spec, source, result, draft: JSON.parse(readFileSync(path.join(dir, "tracker-draft.json"), "utf8")) as Draft };
}

export function register(harness: Harness): void {
  harness.check("spec-pack assignments retain state, repository proof, and declared creative work", () => {
    const { spec, source, result, draft } = run(harness, "assignment-coverage", () => {});
    assert(result.status === 0, result.stdout + result.stderr);
    assert(draft.source?.file === "approved.yaml", "assignment source must use the supplied spec filename");
    assert(draft.source?.sha256 === createHash("sha256").update(source).digest("hex"), "source must bind the exact approved bytes");
    const home = draft.issues.find((issue) => issue.key === "S-home")!;
    assert(home.source.sha256 === draft.source.sha256, "a portable issue must retain its source identity");
    assert(home.checklist_sources.length === home.checklist.length, "every checklist clause needs its source");
    assert(home.checklist_sources.includes("/screens/2/states/1"), "state proof must retain the precise state source");
    assert(home.checklist_sources.includes("/repo/merge_gate/0"), "repository proof must retain the precise clause source");
    assert(
      home.checklist.some((line) => line.includes("empty") && line.includes("mock")),
      "required empty-state proof was dropped",
    );
    for (const rule of spec.repo.merge_gate)
      assert(
        home.checklist.some((line) => line.includes(rule)),
        `merge obligation dropped: ${rule}`,
      );
    assert(home.source_refs.includes("/screens/2"), "screen source identity was dropped");
    for (const [index, asset] of spec.store.creative_assets.entries()) {
      const owners = draft.issues.filter((issue) => issue.source_refs.includes(`/store/creative_assets/${index}`));
      assert(owners.length === 1, `creative asset ${asset.id} needs exactly one assignment`);
      assert(typeof asset.source_provider === "string" && typeof asset.spec === "string", "fixture creative asset needs provider and specification");
      assert(JSON.stringify(owners[0]).includes(asset.source_provider), "selected creative provider must remain visible");
      assert(JSON.stringify(owners[0]).includes(asset.spec), "creative specification must remain visible");
    }
    assert(!draft.issues.some((issue) => issue.key === "C-icon"), "an undeclared app icon must not be invented");
  });

  harness.check("spec-pack contrasting Android practice app preserves optional scope and explicit owners", () => {
    const { spec, result, draft } = run(harness, "assignment-practice", (spec) => {
      spec.meta = { ...spec.meta, name: "Practice Library", slug: "practice-library", stack: "flutter", platforms: ["android"] };
      const home = spec.screens.find((screen) => screen.id === "home")!;
      home.states.push("offline");
      home.mock.offline = [{ type: "text", text: "Downloaded lessons remain available offline." }];
      home.acceptance = ["An offline lesson opens without a network request."];
      spec.repo.merge_gate = ["Android integration tests pass on the supported emulator."];
      spec.store.creative_assets = [
        { id: "product-page-header", placement: "product-page header", media: "image", source_provider: "provider.fixture-art", spec: "creative/header.md" },
      ];
      spec.tasks = [
        {
          id: "art-direction",
          title: "Lesson library art",
          area: "Store & Marketing",
          depends_on: ["S-home"],
          acceptance: ["Use the accepted lesson illustration."],
          source_refs: ["/store/creative_assets/0"],
        },
        { id: "support-review", title: "Review support requests", area: "Ops", depends_on: [], acceptance: ["Summarize unresolved support themes."] },
      ];
    });
    assert(result.status === 0, result.stdout + result.stderr);
    const home = draft.issues.find((issue) => issue.key === "S-home")!;
    assert(
      home.checklist.some((line) => line.includes("offline") && line.includes("mock")),
      "Android offline state was dropped",
    );
    const art = draft.issues.find((issue) => issue.key === "art-direction")!;
    assert(art.blockers.join() === "S-home", "explicit dependency changed");
    assert(art.checklist.includes("Use the accepted lesson illustration."), "authored acceptance was lost");
    assert(
      art.checklist.some((line) => line.includes("Prepare the declared product-page-header") && line.includes("verify")),
      "claimed asset lost its proof obligation",
    );
    assert(draft.issues.filter((issue) => issue.source_refs.includes("/store/creative_assets/0")).length === 1, "explicit creative owner was duplicated");
    assert(!draft.issues.some((issue) => issue.key === "C-product-page-header"), "claimed asset created a competing task");
    const ops = draft.issues.find((issue) => issue.key === "support-review")!;
    assert(ops.checklist.join() === spec.tasks[1]!.acceptance.join(), "non-repository work inherited unrelated build gates");
    assert(
      ops.context.some((entry) => entry.source_ref === "/repo/merge_gate" && entry.when.includes("repository")),
      "unknown repository applicability must remain conditional context",
    );
    assert(!draft.issues.some((issue) => JSON.stringify(issue).includes("provider.higgsfield")), "unselected creative provider leaked into assignment");
  });

  harness.check("spec-pack explicit creative owner inherits proof even without authored acceptance", () => {
    const { result, draft } = run(harness, "assignment-empty-owner", (spec) => {
      spec.tasks = [
        {
          id: "creative-owner",
          title: "Prepare creative",
          area: "Store & Marketing",
          depends_on: ["S-home"],
          acceptance: [],
          source_refs: ["/store/creative_assets/0", "/store/creative_assets/0"],
        },
      ];
    });
    assert(result.status === 0, result.stdout + result.stderr);
    const owners = draft.issues.filter((issue) => issue.source_refs.includes("/store/creative_assets/0"));
    assert(owners.length === 1 && owners[0]!.key === "creative-owner", "explicit ownership must remain unique");
    assert(
      owners[0]!.checklist.length === 1 && owners[0]!.checklist[0]!.includes("verify"),
      "empty acceptance must not erase or duplicate declared-asset proof",
    );
    assert(owners[0]!.checklist_sources.join() === "/store/creative_assets/0", "inherited proof must retain its source");
    assert(owners[0]!.blockers.join() === "S-home", "inherited proof must preserve dependencies");
  });

  harness.check("spec-pack refuses duplicate or unresolved creative ownership without dropping work", () => {
    const { result } = run(harness, "assignment-conflict", (spec) => {
      spec.tasks = ["a", "b"].map((id) => ({
        id,
        title: id,
        area: "Store & Marketing",
        depends_on: [],
        acceptance: ["Prepare the declared art."],
        source_refs: ["/store/creative_assets/0"],
      }));
      spec.tasks.push({ id: "missing", title: "Missing source", area: "Ops", depends_on: [], acceptance: [], source_refs: ["/store/creative_assets/99"] });
    });
    assert(result.status === 1, "conflicting assignment owners must fail the spec check");
    assert(result.stdout.includes("multiple task owners"), "missing duplicate ownership error");
    assert(result.stdout.includes("unresolved source_ref"), "missing unresolved source error");
  });
}
