// CLU-111 learning-ledger schema, Gate 1 emit, and the off-by-default portfolio hook.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Ajv2020, type AnySchema, type ErrorObject } from "ajv/dist/2020.js";
import YAML from "yaml";
import { assert, assertSchemaInvalid, assertSchemaValid, skillRoot, type Harness, type SchemaCheckResult } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");
const recordSchemaPath = path.join(skillRoot, "contracts/portfolio-ledger/learning-ledger.schema.json");
const optionsSchemaPath = path.join(skillRoot, "contracts/portfolio-ledger/user-options.schema.json");
const recordExamplePath = path.join(skillRoot, "examples/workspace/business/strategy/ledger.example.yaml");
const optionsExamplePath = path.join(skillRoot, "examples/workspace/business/strategy/user-options.example.yaml");
const portfolioScript = path.join(skillRoot, "checks/validation/business/operations/check-portfolio-registry.ts");
const CHECKPOINTS = ["gate_2", "day_7", "day_30", "monthly"];
const METRICS = [
  "installs_per_month",
  "revenue_per_month",
  "revenue_per_install",
  "trial_to_paid_rate",
  "retention_d1",
  "retention_d7",
  "retention_d30",
  "invite_rate",
  "refunds",
  "onboarding_step_completion",
  "onboarding_drop_off_per_step",
  "onboarding_completed_rate",
  "time_to_first_core_action",
  "paywall_view_to_trial_or_purchase",
  "discount_take_rate",
  "day_0_cancel_rate",
];

type LedgerDoc = {
  choices: Record<string, unknown>;
  hypotheses: unknown[];
  moves_to?: Record<string, string>;
  schedule: { live_calls: boolean; checkpoints: string[]; sources: string[] };
  outcomes: Array<{ checkpoint: string; why: unknown; metrics: Record<string, unknown> }>;
  compliance: Array<{ status: string; variant: string }>;
  boundary: { returns_to_brigade: boolean; pooled_dataset: boolean };
};

function compile(schemaPath: string): (data: unknown) => SchemaCheckResult {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, "utf8")) as AnySchema);
  return (data) => {
    const valid = Boolean(validate(data));
    return { valid, errors: [...((validate.errors ?? []) as ErrorObject[])] };
  };
}

const validateRecord = compile(recordSchemaPath);
const validateOptions = compile(optionsSchemaPath);

function parseYamlFile(file: string): unknown {
  return YAML.parse(readFileSync(file, "utf8"));
}

function runBuild(specPath: string, outPath: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], { cwd: exampleDir, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function board(extra = ""): string {
  return [
    "# Portfolio Registry",
    "",
    "## Businesses",
    "",
    "| Business | Repo | Stage | MRR (trend) | Last verdict (date) |",
    "| --- | --- | --- | --- | --- |",
    "| _example: Soon_ | _example: soon-example_ | _building_ | _placeholder_ | _hold_ |",
    "",
    "## Allocation",
    "",
    "Hours follow the latest verdict.",
    "",
    "## Cross-App Learnings",
    "",
    "| Learning | Source app | Date | Applied where next |",
    "| --- | --- | --- | --- |",
    "",
    "## Next Launch Pipeline",
    "",
    "| Idea | Evidence so far | Starts when |",
    "| --- | --- | --- |",
    extra,
  ].join("\n");
}

const ledgerSections = [
  "",
  "## Learning Ledger",
  "",
  "Per-app records stay in this private workspace.",
  "",
  "## Comparison",
  "",
  "Show a cell only with at least two apps. Show the sample size. Do not call a winner on a small sample.",
  "",
].join("\n");

export function register(harness: Harness): void {
  harness.check("learning-ledger example record matches the schema and lists every checkpoint metric", () => {
    const doc = parseYamlFile(recordExamplePath) as LedgerDoc;
    assertSchemaValid(validateRecord(doc), "ledger.example.yaml");
    assert(doc.hypotheses.length === 4, `expected 4 hypotheses, got ${doc.hypotheses.length}`);
    assert(doc.outcomes.map((item) => item.checkpoint).join(",") === CHECKPOINTS.join(","), "checkpoint order drifted");
    assert(doc.schedule.live_calls === false, "schedule must not make live calls");
    assert(doc.schedule.sources.join(",") === "posthog,revenuecat,app_store_connect,appkittie", "outcome sources drifted");
    assert(doc.boundary.returns_to_brigade === false, "a record must not return data to Brigade");
    assert(doc.boundary.pooled_dataset === false, "a record must not mark a pooled dataset");
    assert(doc.compliance[0]?.status === "unrecorded", "the public example must not mark a variant as a winner");
    for (const outcome of doc.outcomes) {
      assert(outcome.why === null, `${outcome.checkpoint} is missing the why note`);
      for (const metric of METRICS) {
        assert(Object.prototype.hasOwnProperty.call(outcome.metrics, metric), `${outcome.checkpoint} is missing ${metric}`);
        assert(outcome.metrics[metric] === null, `${outcome.checkpoint}.${metric} must stay empty in the public example`);
      }
    }
    for (const field of [
      "audience",
      "problem_recurrence",
      "download_motive",
      "name",
      "icon",
      "price_model",
      "price",
      "product_type",
      "onboarding_type",
      "onboarding_screen_count",
      "quiz_length",
      "time_to_value",
      "paywall_placement",
      "paywall_type",
      "purchase_kind",
      "closing_discount",
      "mascot",
      "invite_mechanic",
      "acquisition_channels",
      "screenshot_style",
      "aso_keywords",
      "providers",
    ]) {
      assert(choicesHave(doc, field), `choices.${field} is missing`);
    }
    assert(doc.choices.onboarding_type === "utility-quick-start", "the example reads the onboarding archetype");
    assert(doc.choices.onboarding_screen_count === 2, "the example counts onboarding screens");
    assert(doc.choices.quiz_length === 0, "the example has no quiz");
    assert(doc.choices.paywall_placement === "after_first_core_action", "after-first-value maps to after the first core action");
    assert(doc.choices.paywall_type === "soft", "soft or hard stays on the ledger");
    assert(doc.choices.purchase_kind === "one-time", "onboarding paywall type is the purchase model");
    assert(doc.choices.closing_discount === false, "closing_offer no is not a discount");
    assert(doc.choices.mascot === false, "mascot use no is false");
    assert(JSON.stringify(doc.choices.acquisition_channels) === JSON.stringify(["organic", "share"]), "funnel channel ids were not read");
    assert(doc.moves_to === undefined, "present blocks leave moves_to off the example record");
  });

  harness.check("learning-ledger schema rejects a short hypothesis list and a dropped metric", () => {
    const doc = parseYamlFile(recordExamplePath) as LedgerDoc;
    const short = structuredClone(doc);
    short.hypotheses = short.hypotheses.slice(0, 2);
    assertSchemaInvalid(validateRecord(short), "fewer than 3", "two hypotheses");
    const dropped = structuredClone(doc);
    delete dropped.outcomes[0]?.metrics.refunds;
    assertSchemaInvalid(validateRecord(dropped), "refunds", "dropped refunds metric");
  });

  harness.check("learning-ledger schema accepts a failing compliance tag", () => {
    const doc = parseYamlFile(recordExamplePath) as LedgerDoc;
    const failed = structuredClone(doc);
    failed.compliance[0]!.status = "fail";
    assertSchemaValid(validateRecord(failed), "failing compliance tag");
    const guidance = readFileSync(path.join(skillRoot, "knowledge/operations/post-launch-operations.md"), "utf8");
    assert(guidance.includes("never recorded as a winner"), "guidance must refuse a win for a failing variant");
    assert(guidance.includes("at least two apps"), "comparison view must require two apps per cell");
    assert(guidance.includes("sample size"), "comparison view must show sample size");
    assert(guidance.includes("small sample"), "comparison view must refuse a winner on a small sample");
    assert(
      guidance.includes("turn on an app business factory that improves itself to make app businesses that earn"),
      "the setting must use the documented description",
    );
    assert(guidance.includes("Nothing returns to Brigade"), "guidance must keep records out of Brigade");
    assert(guidance.includes("onboarding_step_viewed"), "guidance must use the canonical onboarding event name");
  });

  harness.check("user options default learning_ledger.enabled to false", () => {
    const schema = JSON.parse(readFileSync(optionsSchemaPath, "utf8")) as {
      properties: { learning_ledger: { properties: { enabled: { default: boolean } } } };
    };
    assert(schema.properties.learning_ledger.properties.enabled.default === false, "schema default must be false");
    const options = parseYamlFile(optionsExamplePath) as { learning_ledger: { enabled: boolean } };
    assertSchemaValid(validateOptions(options), "user-options.example.yaml");
    assert(options.learning_ledger.enabled === false, "example setting must be off");
    const handoff = readFileSync(path.join(skillRoot, "knowledge/design/spec-pack.md"), "utf8");
    assert(handoff.includes("contracts/portfolio-ledger/learning-ledger.schema.json"), "Gate 1 handoff must point at the ledger schema");
    const gate = readFileSync(path.join(exampleDir, "GATE1.md"), "utf8");
    assert(
      gate.includes("Approval writes the ledger record to the user's own private store when the ledger is on."),
      "GATE1.md must say where approval writes the record",
    );
  });

  harness.check("spec-pack build emits a ledger record that matches the public example", () => {
    const outDir = harness.makeTempDir("spec-pack-ledger-ok");
    const outPath = path.join(outDir, "index.html");
    const result = runBuild(path.join(exampleDir, "spec.yaml"), outPath);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const emittedPath = path.join(outDir, "ledger-record.yaml");
    const emitted = parseYamlFile(emittedPath);
    const example = parseYamlFile(recordExamplePath);
    assert(JSON.stringify(emitted) === JSON.stringify(example), "emitted ledger-record.yaml drifted from ledger.example.yaml");
  });

  harness.check("spec-pack requires moves_to when onboarding, mascot, and funnel are absent", () => {
    const work = harness.makeTempDir("spec-pack-ledger-absent-blocks");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as {
      onboarding?: unknown;
      mascot?: unknown;
      funnel?: unknown;
    };
    delete spec.onboarding;
    delete spec.mascot;
    delete spec.funnel;
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("ledger: onboarding_type moves to onboarding when present"), `missing onboarding move\n${result.output}`);
    assert(result.output.includes("ledger: mascot moves to mascot when present"), `missing mascot move\n${result.output}`);
    assert(result.output.includes("ledger: acquisition_channels moves to funnel when present"), `missing channel move\n${result.output}`);
  });

  harness.check("spec-pack build fails when hypotheses are missing", () => {
    const work = harness.makeTempDir("spec-pack-ledger-no-hypotheses");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as { hypotheses?: unknown };
    delete spec.hypotheses;
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("hypotheses: need 3 or 4 must-be-true statements"), `missing hypotheses error\n${result.output}`);
  });

  harness.check("spec-pack prefers onboarding, mascot, and funnel blocks when they exist", () => {
    const work = harness.makeTempDir("spec-pack-ledger-blocks");
    const specPath = path.join(work, "spec.yaml");
    const spec = YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as {
      onboarding: {
        archetype?: string;
        screen_count?: number;
        quiz_length?: number;
        paywall_type?: string;
        paywall_placement?: string;
        closing_discount?: boolean;
        purchase_kind?: string;
        paywall?: Record<string, unknown>;
      };
      mascot: { use?: string; reason?: string; present?: boolean };
      funnel: { channels?: unknown };
    };
    spec.onboarding.archetype = "result-reveal";
    spec.onboarding.screen_count = 4;
    spec.onboarding.quiz_length = 3;
    spec.onboarding.paywall_placement = "end_of_onboarding";
    spec.onboarding.paywall_type = "hard";
    spec.onboarding.closing_discount = true;
    spec.onboarding.purchase_kind = "trial";
    spec.onboarding.paywall = {
      ...spec.onboarding.paywall,
      type: "trial",
      placement: "end_of_onboarding",
      closing_offer: "no",
    };
    spec.mascot.use = "yes";
    spec.mascot.present = true;
    spec.funnel.channels = [
      { id: "aso", landing_path: "/", ct: "aso", fallback: "static_href" },
      { id: "referral", landing_path: "/", ct: "referral", fallback: "static_href" },
    ];
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, path.join(work, "index.html"));
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    const doc = parseYamlFile(path.join(work, "ledger-record.yaml")) as LedgerDoc;
    assert(doc.choices.onboarding_type === "result-reveal", "onboarding block was ignored");
    assert(doc.choices.onboarding_screen_count === 4, "screen count should come from the onboarding block");
    assert(doc.choices.quiz_length === 3, "quiz length should come from the onboarding block");
    assert(doc.choices.paywall_placement === "end_of_onboarding", "paywall placement should come from the onboarding block");
    assert(doc.choices.paywall_type === "hard", "paywall type should come from the onboarding block");
    assert(doc.choices.closing_discount === true, "closing discount should come from the onboarding block");
    assert(doc.choices.purchase_kind === "trial", "purchase kind should come from the onboarding block");
    assert(doc.choices.mascot === true, "mascot block was ignored");
    assert(JSON.stringify(doc.choices.acquisition_channels) === JSON.stringify(["aso", "referral"]), "funnel channels were ignored");
    assert(doc.moves_to?.onboarding_type === undefined, "onboarding_type should leave ledger once the block exists");
    assert(doc.moves_to?.mascot === undefined, "mascot should leave ledger once the block exists");
    assert(doc.moves_to?.acquisition_channels === undefined, "channels should leave ledger once funnel exists");
    assertSchemaValid(validateRecord(doc), "record built from later blocks");
  });

  const off = harness.makeTempDir("portfolio-ledger-off");
  mkdirSync(path.join(off, "strategy"), { recursive: true });
  writeFileSync(path.join(off, "strategy/PORTFOLIO_REGISTRY.md"), board(), "utf8");
  writeFileSync(path.join(off, "strategy/user-options.yaml"), "learning_ledger:\n  enabled: false\n", "utf8");
  harness.runScript("portfolio registry with the ledger off skips ledger sections", portfolioScript, ["--root", off], 0, "0 error(s)");

  const onMissing = harness.makeTempDir("portfolio-ledger-on-missing");
  mkdirSync(path.join(onMissing, "strategy"), { recursive: true });
  writeFileSync(path.join(onMissing, "strategy/PORTFOLIO_REGISTRY.md"), board(), "utf8");
  writeFileSync(path.join(onMissing, "strategy/user-options.yaml"), "learning_ledger:\n  enabled: true\n", "utf8");
  harness.runScript(
    "portfolio registry with the ledger on requires ledger sections",
    portfolioScript,
    ["--root", onMissing],
    1,
    "portfolio_registry.section_missing.learning_ledger",
  );

  const onReady = harness.makeTempDir("portfolio-ledger-on-ready");
  mkdirSync(path.join(onReady, "strategy"), { recursive: true });
  writeFileSync(path.join(onReady, "strategy/PORTFOLIO_REGISTRY.md"), board(ledgerSections), "utf8");
  writeFileSync(path.join(onReady, "strategy/user-options.yaml"), "learning_ledger:\n  enabled: true\n", "utf8");
  harness.runScript("portfolio registry with the ledger on and both sections passes", portfolioScript, ["--root", onReady], 0, "0 error(s)");

  const invalid = harness.makeTempDir("portfolio-ledger-invalid");
  mkdirSync(path.join(invalid, "strategy"), { recursive: true });
  writeFileSync(path.join(invalid, "strategy/PORTFOLIO_REGISTRY.md"), board(), "utf8");
  writeFileSync(path.join(invalid, "strategy/user-options.yaml"), "learning_ledger:\n  enabled: yes\n", "utf8");
  harness.runScript(
    "portfolio registry rejects a non-boolean learning_ledger.enabled",
    portfolioScript,
    ["--root", invalid],
    1,
    "portfolio_registry.learning_ledger_options_invalid",
  );

  const absent = harness.makeTempDir("portfolio-ledger-absent");
  mkdirSync(path.join(absent, "strategy"), { recursive: true });
  writeFileSync(path.join(absent, "strategy/user-options.yaml"), "learning_ledger:\n  enabled: true\n", "utf8");
  harness.runScript("missing portfolio registry stays a no-op when the ledger option is on", portfolioScript, ["--root", absent], 0, "0 error(s)");
}

function choicesHave(doc: LedgerDoc, field: string): boolean {
  const value = doc.choices[field];
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (typeof value === "string") return value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}
