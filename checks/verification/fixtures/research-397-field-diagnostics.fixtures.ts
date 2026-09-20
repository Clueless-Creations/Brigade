/**
 * #397 research field diagnostics + contract explain closeout fixtures (U6 R1).
 *
 * Deterministic only. Proves AC1–AC7 + ownership holds + corpus map integrity.
 * Consumes prior #397 increments; does not steal #395/#74. No npm. No live provider.
 * Fixture success ≠ demonstrated real-agent efficiency (#75) or overhead proof (#73).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, skillRoot, type Harness } from "./_harness.js";
import {
  RESEARCH_397_AC,
  RESEARCH_397_ARTIFACT_CONTRACTS,
  RESEARCH_397_AUDIT_DOC,
  RESEARCH_397_BASE_MAIN_SHA,
  RESEARCH_397_CONSUMES,
  RESEARCH_397_CONTRACT,
  RESEARCH_397_COORDINATES,
  RESEARCH_397_CORE_FIXTURES,
  RESEARCH_397_CORPUS,
  RESEARCH_397_FIXTURE,
  RESEARCH_397_ISSUE,
  RESEARCH_397_MAP_PATH,
  RESEARCH_397_NEXT_AFTER_CLOSE,
  RESEARCH_397_NO_395_STEAL,
  RESEARCH_397_NO_74_REWRITE,
  RESEARCH_397_NO_NPM_PUBLISH,
  RESEARCH_397_NO_PROFILE_STEAL,
  RESEARCH_397_NO_SECOND_PARSER,
  RESEARCH_397_OFFER,
  RESEARCH_397_REVIEW_DOC,
  RESEARCH_397_STAMP,
  RESEARCH_397_VALIDATOR,
  research397AcEvidence,
  research397AllAcceptanceDone,
} from "../../../catalog/providers/research-397-field-diagnostics-closeout-map.js";
import { RESEARCH_CONTRACT_EXPLANATION, renderResearchContractExplanation } from "../../../contracts/public-api/research-contract.js";
import { OFFER_TEST_HEADERS } from "../../../checks/validation/business/research/offer-evidence.js";
import { isPlaceholderOnly } from "../../../checks/validation/business/research/research-evidence-helpers.js";

const MAP = path.join(skillRoot, RESEARCH_397_MAP_PATH);
const AUDIT = path.join(skillRoot, RESEARCH_397_AUDIT_DOC);
const REVIEW = path.join(skillRoot, RESEARCH_397_REVIEW_DOC);
const VALIDATOR = path.join(skillRoot, RESEARCH_397_VALIDATOR);
const OFFER = path.join(skillRoot, RESEARCH_397_OFFER);
const CONTRACT = path.join(skillRoot, RESEARCH_397_CONTRACT);
const CORE = path.join(skillRoot, RESEARCH_397_CORE_FIXTURES);
const ARTIFACTS = path.join(skillRoot, RESEARCH_397_ARTIFACT_CONTRACTS);
const PACKAGE = path.join(skillRoot, "package.json");
const SKILL_VERSION = path.join(skillRoot, "skill-version.json");

export function register(harness: Harness): void {
  harness.check("research-397: tip stamps / consumes / holds / AC map integrity", () => {
    assert(existsSync(MAP), "map present");
    assert(existsSync(AUDIT), "audit present");
    assert(existsSync(REVIEW), "review present");
    assert(existsSync(VALIDATOR), "validator present");
    assert(existsSync(OFFER), "offer validator present");
    assert(existsSync(CONTRACT), "contract present");
    assert(existsSync(CORE), "core fixtures present");
    assert(RESEARCH_397_ISSUE === "#397", "issue lock");
    assert(RESEARCH_397_STAMP === "0.221.59", "stamp lock");
    assert(RESEARCH_397_BASE_MAIN_SHA.startsWith("7ce0a61"), "base tip");
    assert(RESEARCH_397_NEXT_AFTER_CLOSE === "#395", "next after close");
    assert(RESEARCH_397_NO_NPM_PUBLISH && RESEARCH_397_NO_PROFILE_STEAL, "publish/profile holds");
    assert(RESEARCH_397_NO_395_STEAL && RESEARCH_397_NO_74_REWRITE && RESEARCH_397_NO_SECOND_PARSER, "ownership holds");
    assert(RESEARCH_397_CONSUMES.length >= 10, "consumes prior increments");
    assert(RESEARCH_397_COORDINATES.includes("#395") && RESEARCH_397_COORDINATES.includes("#74"), "coords");
    assert(research397AllAcceptanceDone(), "all AC covered");
    assert(RESEARCH_397_AC.length === 7, "seven ACs");
    assert(RESEARCH_397_CORPUS.length === 12, "twelve corpus rows");
    for (const row of RESEARCH_397_AC) {
      assert(research397AcEvidence(row.id).length > 0, `evidence for ${row.id}`);
    }
  });

  harness.check("research-397: AC1 diagnostics surface + field-aware helpers exist", () => {
    const validator = readFileSync(VALIDATOR, "utf8");
    const offer = readFileSync(OFFER, "utf8");
    const core = readFileSync(CORE, "utf8");
    assert(validator.includes("isPlaceholderOnly"), "field-aware placeholder helper");
    assert(validator.includes("fixHint"), "repair hints");
    assert(offer.includes("research.offer_test_waiver_missing"), "stable waiver code");
    assert(offer.includes("does not match the final Decision"), "waiver mismatch diagnostic");
    assert(offer.includes("Founder Waiver table is malformed"), "waiver malformed diagnostic");
    assert(core.includes("research diagnostics identify hostile signal content without echoing it"), "hostile sanitization fixture");
  });

  harness.check("research-397: AC2 narrative preserved; TBD-only still rejected", () => {
    const core = readFileSync(CORE, "utf8");
    assert(!isPlaceholderOnly("A weekly review may help recover a missed day pending approval"), "pending prose ok");
    assert(!isPlaceholderOnly('one optional survey answer was "TBD"'), "quoted TBD ok");
    assert(isPlaceholderOnly("TBD"), "TBD-only rejected");
    assert(isPlaceholderOnly("pending"), "pending-only rejected");
    assert(isPlaceholderOnly("unverified"), "unverified-only rejected");
    assert(core.includes("keeps authored pending"), "pending narrative fixtures");
    assert(core.includes("still rejects") && core.includes("placeholder-only"), "negative placeholder fixtures");
  });

  harness.check("research-397: AC3 waiver binding + plus separators", () => {
    const core = readFileSync(CORE, "utf8");
    assert(core.includes("SIG-001 + SIG-002"), "plus separator fixture");
    assert(core.includes("offer waiver"), "waiver fixtures");
    assert(OFFER_TEST_HEADERS.exposure.includes("Evidence source"), "exposure headers");
    assert(OFFER_TEST_HEADERS.waiver.includes("Residual risk accepted"), "waiver headers");
  });

  harness.check("research-397: AC4 explain + examples agree with enforced contract", () => {
    assert(RESEARCH_CONTRACT_EXPLANATION.check === "research", "canonical check name");
    assert(RESEARCH_CONTRACT_EXPLANATION.version === "1.1.0", "explain version");
    const headings = RESEARCH_CONTRACT_EXPLANATION.sections.map((section) => section.heading);
    const requiredHeadings = ["Test Contract", "Exposure And Conversion", "Decision", "Founder Waiver", "Source Ledger", "Signal Records"] as const;
    for (const required of requiredHeadings) {
      assert((headings as readonly string[]).includes(required), `section ${required}`);
    }
    const exposure = RESEARCH_CONTRACT_EXPLANATION.sections.find((section) => section.heading === "Exposure And Conversion");
    assert(exposure !== undefined && exposure.columns.includes("CTA conversions"), "exposure columns");
    const rendered = renderResearchContractExplanation();
    assert(rendered.includes("Exposure And Conversion"), "text explain");
    assert(rendered.includes("#395"), "checkpoint coord");
    assert(rendered.includes("#74"), "proof owner");
    assert(!rendered.includes("Measurement"), "no stale Measurement heading");
    const artifacts = readFileSync(ARTIFACTS, "utf8");
    assert(artifacts.includes("Exposure And Conversion"), "authored contract parity");
    assert(artifacts.includes("b2c check research --explain"), "discoverability");
    const template = readFileSync(path.join(skillRoot, "surfaces/workspace-template/new-business/strategy/OFFER_TEST.md"), "utf8");
    assert(template.includes("## Exposure And Conversion"), "template parity");
    assert(template.includes("## Founder Waiver"), "waiver template");
  });

  harness.check("research-397: AC5 explain is early/read-only; no second parser", () => {
    const validator = readFileSync(VALIDATOR, "utf8");
    const explainIndex = validator.indexOf('process.argv.includes("--explain")');
    const loadCallIndex = validator.indexOf("return loadProjectState(args)");
    assert(explainIndex >= 0 && loadCallIndex > explainIndex, "explain before state load");
    assert(!validator.includes("new MarkdownParser"), "no second parser marker");
    assert(RESEARCH_CONTRACT_EXPLANATION.safety.includes("read-only"), "safety bound");
  });

  harness.check("research-397: AC6 ownership holds recorded", () => {
    const audit = readFileSync(AUDIT, "utf8");
    assert(audit.includes("#395 owns") || audit.includes("**#395**"), "395 ownership");
    assert(audit.includes("#74") && (audit.includes("retains") || audit.includes("Proof-semantics")), "74 ownership");
    assert(audit.includes("do not steal") || audit.includes("Do not steal"), "steal ban");
    assert(audit.includes("no npm") || audit.includes("No npm"), "npm hold");
  });

  harness.check("research-397: AC7 review + corpus handoff + package stamp", () => {
    const review = readFileSync(REVIEW, "utf8");
    assert(review.includes("#397"), "review names issue");
    assert(review.includes("#73") && review.includes("#75"), "corpus handoff");
    assert(review.includes(RESEARCH_397_STAMP), "stamp in review");
    const pkg = JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string };
    const skill = JSON.parse(readFileSync(SKILL_VERSION, "utf8")) as { version: string };
    assert(pkg.version === RESEARCH_397_STAMP, "package stamp");
    assert(skill.version === RESEARCH_397_STAMP, "skill stamp");
    assert(existsSync(path.join(skillRoot, RESEARCH_397_FIXTURE)), "fixture path");
    for (const row of RESEARCH_397_CORPUS) {
      assert(row.id.length > 0 && row.result.length > 0, `corpus ${row.id}`);
    }
  });

  harness.check("research-397: Pivot hold described without claiming lane authoring done", () => {
    const core = readFileSync(CORE, "utf8");
    assert(core.includes("Pivot remains a held checkpoint"), "pivot fixture");
    assert(RESEARCH_CONTRACT_EXPLANATION.checkpoint.nonGo.includes("held checkpoint"), "non-Go hold");
    assert(RESEARCH_CONTRACT_EXPLANATION.checkpoint.nonGo.includes("#395"), "authoring owner named");
  });

  harness.check("research-397: required holds against Profile / npm / #395 start", () => {
    assert(RESEARCH_397_NO_NPM_PUBLISH, "npm hold");
    assert(RESEARCH_397_NO_PROFILE_STEAL, "profile hold");
    assert(RESEARCH_397_NEXT_AFTER_CLOSE === "#395", "stop after close");
  });
}
