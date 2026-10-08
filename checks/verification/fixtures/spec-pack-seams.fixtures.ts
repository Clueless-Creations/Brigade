import { cpSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { resolveTsxBin } from "../../../tooling/lib/tsx-bin.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const freshnessScript = path.join(skillRoot, "checks/validation/repository/check-source-freshness.ts");

function checkModuleCount(dir: string): number {
  return readdirSync(path.join(dir, "checks")).filter((name) => name.endsWith(".mjs")).length;
}

function copyPack(dir: string): string {
  const pack = path.join(dir, "pack");
  mkdirSync(pack, { recursive: true });
  for (const name of ["build.mjs", "template.html", "spec.yaml"]) {
    cpSync(path.join(exampleDir, name), path.join(pack, name));
  }
  cpSync(path.join(exampleDir, "checks"), path.join(pack, "checks"), { recursive: true });
  cpSync(path.join(exampleDir, "sections"), path.join(pack, "sections"), { recursive: true });
  symlinkSync(path.join(skillRoot, "node_modules"), path.join(pack, "node_modules"), "dir");
  return pack;
}

function runBuild(pack: string, args: string[]): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [path.join(pack, "build.mjs"), ...args], { cwd: pack, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function withTasks(pack: string, tasks: unknown[]): void {
  const specPath = path.join(pack, "spec.yaml");
  const spec = YAML.parse(readFileSync(specPath, "utf8")) as { tasks?: unknown };
  spec.tasks = tasks;
  writeFileSync(specPath, YAML.stringify(spec));
}

function sourceRow(id: string, url: string): Record<string, unknown> {
  return { id, name: id, source_type: "docs", url, refresh_cadence_days: 7, owner: "source-freshness" };
}

function writeRegistry(root: string, mainSources: Record<string, unknown>[], fragmentSources: Record<string, unknown>[]): void {
  const dir = path.join(root, "checks/validation/repository");
  mkdirSync(path.join(dir, "source-registry.d"), { recursive: true });
  writeFileSync(path.join(root, "README.md"), "See https://docs.doppler.com/docs/cli before setup.\n", "utf8");
  writeFileSync(path.join(dir, "source-registry.yaml"), YAML.stringify({ schema_version: 1, sources: mainSources }), "utf8");
  writeFileSync(path.join(dir, "source-registry.d/lane.yaml"), YAML.stringify({ schema_version: 1, sources: fragmentSources }), "utf8");
}

function runFreshness(root: string): { status: number | null; output: string } {
  const result = spawnSync(resolveTsxBin(skillRoot), [freshnessScript, "--root", root], { cwd: skillRoot, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

export function register(harness: Harness): void {
  harness.check("spec-pack --list-checks prints one line per module", () => {
    const result = spawnSync(process.execPath, [path.join(exampleDir, "build.mjs"), "--list-checks"], {
      cwd: exampleDir,
      encoding: "utf8",
    });
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.stderr ?? ""}`);
    const lines = (result.stdout ?? "").trim().split("\n").filter(Boolean);
    const expected = checkModuleCount(exampleDir);
    assert(lines.length === expected, `expected ${expected} check lines, got ${lines.length}\n${result.stdout ?? ""}`);
    assert(lines.some((line) => line.startsWith("core:")), `expected the core module line\n${result.stdout ?? ""}`);
    assert(
      lines.some((line) => line.startsWith("launch-tracker:")),
      `expected the launch-tracker module line\n${result.stdout ?? ""}`,
    );
    assert(
      lines.some((line) => line.startsWith("store-creative:")),
      `expected the store-creative module line\n${result.stdout ?? ""}`,
    );
    assert(
      lines.some((line) => line.startsWith("accounts-privacy:")),
      `expected the accounts-privacy module line\n${result.stdout ?? ""}`,
    );
    assert(lines.some((line) => line.startsWith("onboarding:")), `expected the onboarding module line\n${result.stdout ?? ""}`);
  });

  harness.check("spec-pack loads an added check module", () => {
    const pack = copyPack(harness.makeTempDir("spec-pack-check-seam"));
    const before = checkModuleCount(pack);
    writeFileSync(
      path.join(pack, "checks/90-x.mjs"),
      'export const id = "x";\nexport const describe = "fixture check";\nexport function check() { return ["fixture-check: extra seam failed"]; }\n',
      "utf8",
    );
    const listed = runBuild(pack, ["--list-checks"]);
    const lines = listed.output.trim().split("\n").filter(Boolean);
    const modules = readdirSync(path.join(pack, "checks")).filter((name) => name.endsWith(".mjs"));
    assert(listed.status === 0, `expected list exit 0, got ${listed.status}\n${listed.output}`);
    assert(lines.length === before + 1, `expected ${before + 1} check lines, got ${lines.length}\n${listed.output}`);
    assert(lines.length === modules.length, `expected one line per check module, got ${lines.length}\n${listed.output}`);
    assert(lines.some((line) => line.startsWith("x:")), `expected the added module line\n${listed.output}`);
    const built = runBuild(pack, ["spec.yaml", "index.html"]);
    assert(built.status === 1, `expected exit 1, got ${built.status}\n${built.output}`);
    assert(built.output.includes("fixture-check: extra seam failed"), `missing extra check error\n${built.output}`);
  });

  harness.check("spec-pack renders an added section and skips a null section", () => {
    const pack = copyPack(harness.makeTempDir("spec-pack-section-seam"));
    writeFileSync(
      path.join(pack, "sections/90-x.js"),
      [
        'window.SPEC_SECTIONS.push({ id: "skipped-seam", title: "Skipped seam", render() { return null; } });',
        'window.SPEC_SECTIONS.push({ id: "extra-seam", title: "Extra seam", render() { return "<p>fixture-section-rendered</p>"; } });',
        "",
      ].join("\n"),
      "utf8",
    );
    const built = runBuild(pack, ["spec.yaml", "index.html"]);
    assert(built.status === 0, `expected exit 0, got ${built.status}\n${built.output}`);
    const html = readFileSync(path.join(pack, "index.html"), "utf8");
    assert(html.includes('id: "extra-seam"'), "added section was not injected");
    assert(html.includes("fixture-section-rendered"), "added section render was not injected");
    assert(html.includes('id: "skipped-seam"'), "null section was not injected");
    assert(html.includes("if (html == null) continue"), "the page does not skip a null section");
    assert(html.includes("el.id = section.id"), "the page does not render a section id");
  });

  harness.check("spec-pack tasks fail on an unknown depends_on", () => {
    const pack = copyPack(harness.makeTempDir("spec-pack-task-dep"));
    withTasks(pack, [{ id: "dangling", title: "Dangling", area: "App", depends_on: ["missing-task"], acceptance: [], capabilities: [] }]);
    const built = runBuild(pack, ["spec.yaml", "index.html"]);
    assert(built.status === 1, `expected exit 1, got ${built.status}\n${built.output}`);
    assert(built.output.includes('tasks: "dangling" depends_on unknown task "missing-task"'), `missing unknown-dependency error\n${built.output}`);
  });

  harness.check("spec-pack tasks fail on a dependency cycle", () => {
    const pack = copyPack(harness.makeTempDir("spec-pack-task-cycle"));
    withTasks(pack, [
      { id: "cycle-a", title: "A", area: "Ops", depends_on: ["cycle-b"], acceptance: [], capabilities: [] },
      { id: "cycle-b", title: "B", area: "Ops", depends_on: ["cycle-a"], acceptance: [], capabilities: [] },
    ]);
    const built = runBuild(pack, ["spec.yaml", "index.html"]);
    assert(built.status === 1, `expected exit 1, got ${built.status}\n${built.output}`);
    assert(built.output.includes("tasks: cycle cycle-a -> cycle-b -> cycle-a"), `missing cycle error\n${built.output}`);
  });

  harness.check("source-registry fragment registers a URL that is not in the main file", () => {
    const root = harness.makeTempDir("source-registry-fragment");
    writeRegistry(root, [], [sourceRow("fragment-only", "https://docs.doppler.com/docs/cli")]);
    const result = runFreshness(root);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    assert(!result.output.includes("source_freshness.url_unregistered"), `fragment URL was treated as unregistered\n${result.output}`);
  });

  harness.check("source-registry duplicate id across files fails", () => {
    const root = harness.makeTempDir("source-registry-duplicate-id");
    writeRegistry(
      root,
      [sourceRow("shared-source", "https://docs.doppler.com/docs/cli")],
      [sourceRow("shared-source", "https://docs.doppler.com/docs/getting-started")],
    );
    const result = runFreshness(root);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("source_freshness.sources.duplicate_id"), `missing duplicate-id error\n${result.output}`);
  });

  harness.check("source-registry duplicate url across files fails", () => {
    const root = harness.makeTempDir("source-registry-duplicate-url");
    writeRegistry(root, [sourceRow("source-a", "https://docs.doppler.com/docs/cli")], [sourceRow("source-b", "https://docs.doppler.com/docs/cli/")]);
    const result = runFreshness(root);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("source_freshness.sources.duplicate_url"), `missing duplicate-url error\n${result.output}`);
  });

  harness.check("source freshness ignores a JSON escape of a placeholder URL", () => {
    const root = harness.makeTempDir("source-freshness-json-escape");
    writeRegistry(root, [sourceRow("doppler-cli", "https://docs.doppler.com/docs/cli")], []);
    writeFileSync(path.join(root, "page.html"), '{\n  "web_origin": "https://\\u003cslug>.\\u003caccount>.workers.dev"\n}\n', "utf8");
    const result = runFreshness(root);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    assert(!result.output.includes("u003cslug"), `escape was treated as a source\n${result.output}`);
  });

  harness.check("source freshness still flags a real unregistered URL", () => {
    const root = harness.makeTempDir("source-freshness-real-url");
    writeRegistry(root, [sourceRow("doppler-cli", "https://docs.doppler.com/docs/cli")], []);
    writeFileSync(
      path.join(root, "README.md"),
      "See https://docs.doppler.com/docs/cli and https://registry.example-unregistered.tools/guide\n",
      "utf8",
    );
    const result = runFreshness(root);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(
      result.output.includes("https://registry.example-unregistered.tools/guide"),
      `real URL was not reported\n${result.output}`,
    );
  });
}
