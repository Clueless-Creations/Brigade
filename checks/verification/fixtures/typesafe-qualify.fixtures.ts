/**
 * #513 SQ-02 TypeSafe qualification fixtures (paper; no live).
 *
 * Asserts mapping dispositions, version-fact distinctness, unknowns-block-live,
 * qualify-without-install, wiring-recipe presence (env names; no secrets),
 * official-doc fixture provenance, and live-not-performed honesty.
 * Does not call the network, invent credentials, install SDKs, or implement #515.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SEMANTIC_CONTRACTS_DIR,
  TYPESAFE_API_BASE_DEFAULT,
  TYPESAFE_CONFIRM_WITHOUT_PRINT,
  TYPESAFE_DISPOSITIONS,
  TYPESAFE_DOCS_OBSERVED_AT,
  TYPESAFE_DOCS_URL,
  TYPESAFE_ENV_OPTIONAL,
  TYPESAFE_ENV_REQUIRED,
  TYPESAFE_FREE_UNTIL,
  TYPESAFE_HOSTED_KEY_OWNER,
  TYPESAFE_HOW_TO_BUILD_URL,
  TYPESAFE_JEV_OPS_NOTES,
  TYPESAFE_LICENSE_SHA256,
  TYPESAFE_LIVE_NOT_PERFORMED,
  TYPESAFE_MAPPINGS,
  TYPESAFE_MODEL_DEFAULT,
  TYPESAFE_NPM_SDK_VERSION,
  TYPESAFE_OFFICIAL_DOC_FIXTURES,
  TYPESAFE_PYTHON_SDK_COMMIT,
  TYPESAFE_PYTHON_SDK_VERSION,
  TYPESAFE_QUALIFY_BASE_MAIN_SHA,
  TYPESAFE_QUALIFY_DOC,
  TYPESAFE_QUALIFY_EPIC,
  TYPESAFE_QUALIFY_ISSUE,
  TYPESAFE_QUALIFY_NEXT,
  TYPESAFE_QUALIFY_STAMP,
  TYPESAFE_TRANSPORT_RECOMMENDATION,
  TYPESAFE_ULTRAFAST_NOTE_POST_515,
  TYPESAFE_UPSTREAM_MANIFEST,
  TYPESAFE_UPSTREAM_NOTICE,
  TYPESAFE_UPSTREAM_OBSERVATION,
  typesafeDispositionCounts,
  typesafeLiveAllowedByDefault,
  typesafeUnknownsBlockLive,
  typesafeVersionFactsDistinct,
} from "../../../catalog/providers/typesafe-qualify-map.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

function read(rel: string): string {
  return readFileSync(path.join(skillRoot, rel), "utf8");
}

function sha256(text: string | Buffer): string {
  return createHash("sha256").update(text).digest("hex");
}

export function register(harness: Harness): void {
  harness.check("typesafe-qualify: upstream identity + notice + observation present", () => {
    assert(existsSync(path.join(skillRoot, TYPESAFE_UPSTREAM_MANIFEST)), "upstream manifest");
    assert(existsSync(path.join(skillRoot, TYPESAFE_UPSTREAM_NOTICE)), "notice file");
    assert(existsSync(path.join(skillRoot, TYPESAFE_UPSTREAM_OBSERVATION)), "observation");
    assert(existsSync(path.join(skillRoot, TYPESAFE_QUALIFY_DOC)), "qualification doc");
    const manifest = read(TYPESAFE_UPSTREAM_MANIFEST);
    assert(manifest.includes("id: typesafe-ai"), "manifest id");
    assert(manifest.includes("remote-service"), "remote-service relationship");
    assert(manifest.includes("service_terms:"), "service terms separate from SDK MIT");
    assert(manifest.includes("status: unreviewed"), "service terms unreviewed");
    assert(manifest.includes("live-systemone-assessment"), "live unsupported op");
    assert(manifest.includes("install-brigade-dependency"), "install unsupported op");
    assert(manifest.includes("claim-marketing-sla"), "SLA unsupported op");
    const noticeSha = sha256(readFileSync(path.join(skillRoot, TYPESAFE_UPSTREAM_NOTICE)));
    assert(noticeSha === TYPESAFE_LICENSE_SHA256, "notice sha matches retained digest");
    assert(manifest.includes(TYPESAFE_LICENSE_SHA256), "manifest cites notice digest");
  });

  harness.check("typesafe-qualify: mapping rows have disposition + provenance + effects", () => {
    assert(TYPESAFE_MAPPINGS.length === 11, "eleven mapping rows");
    for (const row of TYPESAFE_MAPPINGS) {
      assert((TYPESAFE_DISPOSITIONS as readonly string[]).includes(row.disposition), `${row.id} disposition`);
      assert(row.effects.trim().length > 8, `${row.id} effects`);
      assert(row.limitations.trim().length > 8, `${row.id} limitations`);
      assert(row.provenance.trim().length > 8, `${row.id} provenance`);
      assert(row.native.trim().length > 0 && row.sq01.trim().length > 0, `${row.id} native/sq01`);
    }
    const counts = typesafeDispositionCounts();
    assert(counts.implement === 5, "implement count 5");
    assert(counts.defer === 3, "defer count 3");
    assert(counts.reject === 3, "reject count 3");
  });

  harness.check("typesafe-qualify: version facts stay distinct", () => {
    assert(typesafeVersionFactsDistinct(), "python≠npm and docs date + commit present");
    assert(TYPESAFE_PYTHON_SDK_VERSION === "0.7.0", "python sdk 0.7.0");
    assert(TYPESAFE_NPM_SDK_VERSION === "0.6.0", "npm sdk 0.6.0");
    assert(TYPESAFE_DOCS_OBSERVED_AT === "2026-09-19", "docs observed date");
    assert(TYPESAFE_PYTHON_SDK_COMMIT === "2ce5c65f13646cab6e6f782328194c9d85f3300a", "python commit");
    const observation = read(TYPESAFE_UPSTREAM_OBSERVATION);
    assert(observation.includes("v0.7.0"), "observation python tag");
    assert(observation.includes(TYPESAFE_PYTHON_SDK_COMMIT), "observation commit");
    assert(observation.includes("@typesafe-ai/sdk"), "observation notes distinct npm");
  });

  harness.check("typesafe-qualify: unknowns block live; live not performed", () => {
    assert(TYPESAFE_LIVE_NOT_PERFORMED === true, "live-not-performed flag");
    assert(typesafeLiveAllowedByDefault() === false, "default live denied");
    assert(typesafeUnknownsBlockLive() === true, "unknowns block live");
    const doc = read(TYPESAFE_QUALIFY_DOC);
    assert(doc.includes("Live assessment not performed") || doc.includes("live-not-performed"), "doc live honesty");
    assert(doc.includes("block live"), "doc block live language");
    assert(!doc.includes("live assessment performed"), "no false live claim");
  });

  harness.check("typesafe-qualify: qualify without install (no Brigade SDK dependency)", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    assert(!Object.keys(deps).some((name) => /typesafe/i.test(name)), "no typesafe package dependency");
    const lock = read("package-lock.json");
    assert(!lock.includes('"node_modules/@typesafe-ai/sdk"'), "no js sdk in lock");
    assert(!lock.includes('"node_modules/typesafe-sdk"'), "no python-named npm package");
    const manifest = read(TYPESAFE_UPSTREAM_MANIFEST);
    assert(manifest.includes("qualify-without-install") || manifest.includes("install-brigade-dependency"), "manifest allows defer without install");
  });

  harness.check("typesafe-qualify: Eduardo wiring recipe present (names only; no secrets)", () => {
    const doc = read(TYPESAFE_QUALIFY_DOC);
    assert(doc.includes(TYPESAFE_DOCS_URL), "docs.typesafe.ai");
    assert(doc.includes(TYPESAFE_HOW_TO_BUILD_URL), "how-to-build url");
    for (const note of TYPESAFE_JEV_OPS_NOTES) {
      assert(doc.includes(note), `jev-ops note ${note}`);
    }
    assert(doc.includes(TYPESAFE_ULTRAFAST_NOTE_POST_515), "ultrafast cite post-515");
    assert(doc.includes("post-#515") || doc.includes("post-#515"), "post-515 language");
    for (const name of TYPESAFE_ENV_REQUIRED) assert(doc.includes(name), `env required ${name}`);
    for (const name of TYPESAFE_ENV_OPTIONAL) assert(doc.includes(name), `env optional ${name}`);
    assert(doc.includes(TYPESAFE_CONFIRM_WITHOUT_PRINT), "confirm without print");
    assert(doc.includes(TYPESAFE_HOSTED_KEY_OWNER), "hosted key owner");
    assert(doc.includes(TYPESAFE_FREE_UNTIL), "free until residual");
    assert(doc.includes(TYPESAFE_API_BASE_DEFAULT), "default base url name/context");
    assert(doc.includes(TYPESAFE_MODEL_DEFAULT), "default model name");
    // No secret-shaped assignments in the recipe doc.
    assert(!/TYPESAFE_API_KEY\s*=\s*['\"][^'\"]+['\"]/.test(doc), "no typed key assignment");
    assert(!/sk-[A-Za-z0-9]{10,}/.test(doc), "no sk- secret pattern");
    assert(!/Bearer\s+[A-Za-z0-9._\-]{20,}/.test(doc), "no bearer token literal");
  });

  harness.check("typesafe-qualify: official-doc fixtures provenance (not adapter-authored)", () => {
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.evidenceClass === "official-public-docs", "evidence class");
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.sourceRevision.includes(TYPESAFE_DOCS_OBSERVED_AT), "revision date");
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.noulResponse.answers.is_urgent.type === "noul", "noul type");
    assert(typeof TYPESAFE_OFFICIAL_DOC_FIXTURES.noulResponse.answers.is_urgent.noul === "number", "noul value");
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.choiceResponse.answers.department.choice === "technical", "choice selected");
    assert(TYPESAFE_OFFICIAL_DOC_FIXTURES.scoreResponse.answers.frustration.score === 1.6, "score value");
    // Adapter does not exist yet — fixtures must not claim adapter expected-native authorship.
    assert(!("adapterExpectedNative" in TYPESAFE_OFFICIAL_DOC_FIXTURES), "no adapter-authored expected native");
  });

  harness.check("typesafe-qualify: consumes SQ-01 contracts; transport recommendation only", () => {
    assert(existsSync(path.join(skillRoot, SEMANTIC_CONTRACTS_DIR, "questions.ts")), "questions contract");
    assert(existsSync(path.join(skillRoot, SEMANTIC_CONTRACTS_DIR, "index.ts")), "semantic index");
    assert(TYPESAFE_TRANSPORT_RECOMMENDATION === "thin-direct-http", "thin http recommendation");
    const doc = read(TYPESAFE_QUALIFY_DOC);
    assert(doc.includes("thin direct"), "doc recommends thin direct");
    assert(doc.includes("#515"), "defers transport to #515");
    assert(!existsSync(path.join(skillRoot, "adapters/providers/typesafe")), "no typesafe adapter dir");
  });

  harness.check("typesafe-qualify: issue/epic/stamp/next STOP pins", () => {
    assert(TYPESAFE_QUALIFY_ISSUE === "#513", "issue");
    assert(TYPESAFE_QUALIFY_EPIC === "#511", "epic");
    assert(TYPESAFE_QUALIFY_NEXT === "#515", "next");
    assert(TYPESAFE_QUALIFY_STAMP === "0.221.33", "stamp");
    assert(TYPESAFE_QUALIFY_BASE_MAIN_SHA === "38f7b6fb123606940c811c40f02073fc8f73bbed", "base sha");
    const doc = read(TYPESAFE_QUALIFY_DOC);
    assert(doc.includes("STOP"), "STOP after close");
    assert(doc.includes("#515"), "next deepen #515");
  });
}
