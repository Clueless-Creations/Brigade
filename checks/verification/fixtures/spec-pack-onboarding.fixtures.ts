// Onboarding archetype, mascot, and Bier checks. CLU-112.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { PROVISIONING_MANIFEST } from "../../../adapters/provisioning/requirements.js";
import { roles } from "../../../catalog/roles.js";
import { workflows } from "../../../catalog/workflows/operations-trust.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

type Block = Record<string, unknown>;
type Screen = {
  id: string;
  flow?: string;
  title?: string;
  mock?: Record<string, Block[]>;
  events?: string[];
};
type SpecDoc = {
  onboarding?: {
    archetype?: string;
    reason?: string;
    steps?: Block[];
    paywall?: Block;
    review_prompt?: Block;
    steps_not_used?: Block[];
  };
  mascot?: { use?: string; reason?: string };
  screens: Screen[];
  analytics: { events: Array<{ name: string }> };
};

function loadSpec(): SpecDoc {
  return YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc;
}

function runBuild(spec: SpecDoc, workDir: string): { status: number | null; output: string } {
  const specPath = path.join(workDir, "spec.yaml");
  const outPath = path.join(workDir, "index.html");
  writeFileSync(specPath, YAML.stringify(spec));
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function expectErrors(harness: Harness, label: string, mutate: (spec: SpecDoc) => void, messages: string[]): void {
  harness.check(label, () => {
    const spec = loadSpec();
    mutate(spec);
    const result = runBuild(spec, harness.makeTempDir(label.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)));
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    for (const message of messages) {
      assert(result.output.includes(message), `missing ${message}\n${result.output}`);
    }
  });
}

function addEvent(spec: SpecDoc, name: string): void {
  spec.analytics.events.push({ name });
}

export function register(harness: Harness): void {
  expectErrors(harness, "spec-pack onboarding fails when archetype is missing", (spec) => {
    if (spec.onboarding) delete spec.onboarding.archetype;
  }, ["onboarding: archetype is missing"]);

  expectErrors(harness, "spec-pack onboarding fails when reason is missing", (spec) => {
    if (spec.onboarding) delete spec.onboarding.reason;
  }, ["onboarding: reason is missing"]);

  expectErrors(harness, "spec-pack utility-quick-start fails above 5 onboarding screens", (spec) => {
    for (const screen of spec.screens) screen.flow = "onboarding";
  }, ["onboarding: utility-quick-start has 6 onboarding screens; the maximum is 5"]);

  expectErrors(harness, "spec-pack utility-quick-start fails when it includes a quiz", (spec) => {
    spec.onboarding?.steps?.push({ id: "quiz", kind: "quiz" });
  }, ["onboarding: utility-quick-start includes a quiz"]);

  expectErrors(harness, "spec-pack quiz-led comparison fails without baseline_source", (spec) => {
    if (!spec.onboarding) return;
    spec.onboarding.archetype = "quiz-led-problem";
    spec.onboarding.steps = [
      { id: "results", kind: "results-comparison", comparison: "yes" },
      { id: "plan", computation: "score from the answers", reminder: "trial ends in 2 days" },
    ];
    addEvent(spec, "onboarding_answer_selected");
  }, ['onboarding: step "results" shows a comparison without baseline_source']);

  expectErrors(harness, "spec-pack quiz-led-problem fails without a computation", (spec) => {
    if (!spec.onboarding) return;
    spec.onboarding.archetype = "quiz-led-problem";
    spec.onboarding.steps = [{ id: "plan", reminder: "trial ends in 2 days" }];
    addEvent(spec, "onboarding_answer_selected");
  }, ["onboarding: quiz-led-problem is missing a plan-loader computation"]);

  expectErrors(harness, "spec-pack quiz-led-problem fails without a reminder", (spec) => {
    if (!spec.onboarding) return;
    spec.onboarding.archetype = "quiz-led-problem";
    spec.onboarding.steps = [{ id: "plan", computation: "score from the answers" }];
    addEvent(spec, "onboarding_answer_selected");
  }, ["onboarding: quiz-led-problem is missing a timeline reminder"]);

  expectErrors(harness, "spec-pack closing offer fails without standard_price", (spec) => {
    if (!spec.onboarding?.paywall) return;
    spec.onboarding.paywall.closing_offer = "yes";
    spec.onboarding.paywall.renewal_price = "renewal price";
    spec.onboarding.paywall.eligibility = "once";
    addEvent(spec, "closing_offer_viewed");
    addEvent(spec, "closing_offer_selected");
  }, ["onboarding: closing offer is missing standard_price"]);

  expectErrors(harness, "spec-pack closing offer fails unless eligibility is once", (spec) => {
    if (!spec.onboarding?.paywall) return;
    spec.onboarding.paywall.closing_offer = "yes";
    spec.onboarding.paywall.standard_price = "standard price";
    spec.onboarding.paywall.renewal_price = "renewal price";
    spec.onboarding.paywall.eligibility = "repeat";
    addEvent(spec, "closing_offer_viewed");
    addEvent(spec, "closing_offer_selected");
  }, ["onboarding: closing offer eligibility must be once"]);

  expectErrors(harness, "spec-pack fails on a custom rating prompt", (spec) => {
    if (!spec.onboarding?.review_prompt) return;
    spec.onboarding.review_prompt.type = "custom";
  }, ['onboarding: custom rating screen "review_prompt"']);

  expectErrors(harness, "spec-pack fails on a custom rating mock", (spec) => {
    const welcome = spec.screens.find((screen) => screen.id === "welcome");
    welcome?.mock?.default?.push({ type: "rating", text: "Rate this app" });
  }, ['onboarding: custom rating screen "welcome"']);

  expectErrors(harness, "spec-pack archetype fails when a required event is missing", (spec) => {
    spec.analytics.events = spec.analytics.events.filter((event) => event.name !== "onboarding_started");
    const welcome = spec.screens.find((screen) => screen.id === "welcome");
    if (welcome?.events) welcome.events = welcome.events.filter((name) => name !== "onboarding_started");
  }, ['onboarding: archetype utility-quick-start is missing event "onboarding_started"']);

  expectErrors(harness, "spec-pack first screen fails on a sign-up block", (spec) => {
    const welcome = spec.screens.find((screen) => screen.id === "welcome");
    welcome?.mock?.default?.push({ type: "button", text: "Sign up" });
  }, ['onboarding: first screen "welcome" default mock has a sign-up block']);

  expectErrors(harness, "spec-pack first screen fails when core value is missing", (spec) => {
    const welcome = spec.screens.find((screen) => screen.id === "welcome");
    if (welcome?.mock?.default) {
      welcome.mock.default = welcome.mock.default.filter((block) => block.type !== "title" && block.type !== "text");
    }
  }, ['onboarding: first screen "welcome" default mock does not show core value']);

  expectErrors(harness, "spec-pack mascot fails when use and reason are missing", (spec) => {
    delete spec.mascot;
  }, ["mascot: use is missing", "mascot: reason is missing"]);

  harness.check("provider.screensdesign and provider.masko are held paid providers", () => {
    for (const id of ["provider.screensdesign", "provider.masko"] as const) {
      const provider = PROVISIONING_MANIFEST.find((entry) => entry.providerId === id);
      assert(provider !== undefined, `${id} is missing from PROVISIONING_MANIFEST`);
      const text = `${provider.unlocks}\n${provider.requirements.map((item) => item.name).join("\n")}`;
      assert(text.includes("paid, needs founder yes"), `${id} must say paid, needs founder yes`);
    }
    const masko = PROVISIONING_MANIFEST.find((entry) => entry.providerId === "provider.masko");
    assert(masko?.unlocks.includes("dry-run quote"), "Masko must record the dry-run quote");
    assert(masko?.unlocks.includes("not spend approval"), "Masko quote must not be spend approval");

    const operator = roles.find((role) => role.id === "role.operator-readiness");
    const design = roles.find((role) => role.id === "role.design-guru");
    const ledger = workflows.find((workflow) => workflow.id === "workflow.operations.agent-operations-ledger");
    for (const list of [operator?.capabilityIds, design?.capabilityIds, ledger?.providerIds]) {
      assert(list !== undefined, "provider list missing");
      assert(list.at(-2) === "provider.screensdesign", `expected screensdesign at the end, got ${list.at(-2)}`);
      assert(list.at(-1) === "provider.masko", `expected masko at the end, got ${list.at(-1)}`);
    }

    const routing = readFileSync(path.join(skillRoot, "knowledge/operations/paid-tool-routing.md"), "utf8");
    const decisions = readFileSync(path.join(skillRoot, "examples/workspace/business/strategy/TOOL_DECISIONS.md"), "utf8");
    for (const text of [routing, decisions]) {
      assert(text.includes("paid, needs founder yes"), "intake docs must mark the hold");
      assert(text.includes("dry-run quote is not spend approval") || text.includes("The quote is not spend approval"), "intake docs must keep the quote hold");
    }
    assert(routing.includes("https://masko.ai/docs/canvas/generate-all"), "paid-tool routing must cite the generate-all docs");
    assert(decisions.includes("Workflow intake is not recorded yet"), "the unused intake seed must stay");
  });
}
