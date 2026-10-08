// Core spec-pack checks. Lane cases live in spec-pack-<area>.fixtures.ts.
// checks/verification/fixtures/run.ts loads every *.fixtures.ts in this directory.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

type SpecDoc = {
  screens: Array<{
    id: string;
    states?: string[];
    not_applicable?: Record<string, string>;
    mock?: Record<string, Array<Record<string, unknown>>>;
    acceptance?: string[];
    events?: string[];
  }>;
};

function runBuild(specPath: string, outPath: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

export function register(harness: Harness): void {
  harness.check("spec-pack example build.mjs exits 0 with 0 errors", () => {
    const outDir = harness.makeTempDir("spec-pack-ok");
    const outPath = path.join(outDir, "index.html");
    const result = runBuild(path.join(exampleDir, "spec.yaml"), outPath);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    assert(result.output.includes("0 errors"), `expected "0 errors" in output\n${result.output}`);
  });

  harness.check("spec-pack build.mjs exits 1 for missing state, unknown tap, and unreachable screen", () => {
    const work = harness.makeTempDir("spec-pack-broken");
    const specPath = path.join(work, "spec.yaml");
    const outPath = path.join(work, "index.html");
    copyFileSync(path.join(exampleDir, "spec.yaml"), specPath);
    const spec = YAML.parse(readFileSync(specPath, "utf8")) as SpecDoc;
    const welcome = spec.screens.find((screen) => screen.id === "welcome");
    assert(welcome !== undefined, "example spec must include a welcome screen");
    if (welcome.not_applicable) delete welcome.not_applicable.loading;
    const defaultMock = welcome.mock?.default ?? [];
    defaultMock.push({ type: "button", text: "Broken target", to: "ghost-screen" });
    welcome.mock = { ...(welcome.mock ?? {}), default: defaultMock };
    spec.screens.push({
      id: "orphan",
      states: ["default"],
      not_applicable: { loading: "isolated fixture", empty: "isolated fixture", error: "isolated fixture" },
      mock: { default: [{ type: "title", text: "Unreachable" }] },
      acceptance: ["Isolated fixture screen."],
      events: [],
    });
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, outPath);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(
      result.output.includes('welcome: "loading" is neither a state nor not_applicable with a reason'),
      `missing missing-state message\n${result.output}`,
    );
    assert(result.output.includes('welcome: tap target "ghost-screen" is not a screen'), `missing unknown-tap message\n${result.output}`);
    assert(result.output.includes("orphan: not reachable in the prototype"), `missing unreachable-screen message\n${result.output}`);
  });

  harness.check("spec-pack example includes a Gate 1 handoff template", () => {
    const text = readFileSync(path.join(exampleDir, "GATE1.md"), "utf8");
    for (const heading of [
      "## Angle",
      "## Name",
      "## Price",
      "## Size",
      "## What you approve",
      "## Open questions",
      "## After approval",
      "## Tracker",
    ]) {
      assert(text.includes(heading), `GATE1.md must include ${heading}`);
    }
    assert(text.includes("{app_name}"), "GATE1.md must use {app_name} as a placeholder");
    assert(
      text.includes("Do not create tracker issues or store listings before approval"),
      "GATE1.md must forbid tracker and store writes before approval",
    );
    assert(!/tiptoe/i.test(text), "GATE1.md must stay generic; do not include the pilot app name");
  });
}
