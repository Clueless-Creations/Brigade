import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { importProfile, MAX_PROFILE_BYTES, revisionOf, schema, validateProfile } from "./conformance.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const read = (mode) => readFileSync(new URL(`./examples/${mode}.json`, import.meta.url), "utf8");
const fixture = (mode = "intended") => JSON.parse(read(mode));
function rejects(name, change, pattern, mode = "intended") {
  test(name, () => {
    const value = fixture(mode);
    change(value);
    value.revision = revisionOf(value);
    assert.throws(() => importProfile(JSON.stringify(value)), pattern);
  });
}

for (const mode of ["intended", "observed", "observed-reference"]) {
  test(`${mode}: schema, semantic validation, round-trip, and common ID lookup`, () => {
    const value = fixture(mode);
    assert.deepEqual(validateProfile(value), []);
    const reader = importProfile(read(mode));
    const reimported = importProfile(reader.export());
    assert.deepEqual(reimported.profile, value);
    for (const record of [...value.elements, ...value.relationships, ...value.claims, ...value.evidence, ...value.coverage, ...value.unknowns]) {
      assert.deepEqual(reimported.get(record.id), record);
    }
    assert.deepEqual(reimported.get("journey:learn").steps, ["transition:complete"]);
    assert.equal(reimported.get("unknown:absent"), null);
  });
}

test("reference specialization preserves common IDs and fields without conversion", () => {
  const intended = importProfile(read("intended"));
  const observed = importProfile(read("observed"));
  const reference = importProfile(read("observed-reference"));
  assert.equal(reference.profile.apiVersion, intended.profile.apiVersion);
  assert.deepEqual(reference.profile.elements, intended.profile.elements);
  assert.deepEqual(reference.profile.elements, observed.profile.elements);
  assert.deepEqual(reference.profile.relationships, observed.profile.relationships);
  assert.deepEqual(reference.profile.claims, observed.profile.claims);
  assert.deepEqual(reference.profile.extensions.reference, importProfile(reference.export()).profile.extensions.reference);
});

test("repeated reads are immutable and do not resolve locators or call inference", () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    throw new Error("unexpected provider call");
  };
  try {
    const input = fixture("observed-reference");
    input.provenance.sources[0].locator = "untrusted:do-not-open";
    input.revision = revisionOf(input);
    const json = JSON.stringify(input);
    const reader = importProfile(json);
    for (let i = 0; i < 10; i++) {
      assert.equal(reader.get("state:completed").id, "state:completed");
      assert.equal(reader.export(), json);
    }
    assert.throws(() => {
      reader.get("state:completed").name = "changed";
    }, TypeError);
    assert.throws(() => {
      reader.profile.extensions.reference.dissection.limitations.push("changed");
    }, TypeError);
    assert.equal(calls, 0);
    assert.equal(JSON.stringify(input), json);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("IDs survive display-name changes, record reordering, and source regeneration", () => {
  const value = fixture();
  const prior = value.revision;
  value.elements.reverse();
  value.elements.find((e) => e.id === "surface:lesson").name = "Renamed lesson";
  value.provenance.sources[0].revision = "fixture-r2";
  value.provenance.sources[0].contentDigest = `sha256:${"1".repeat(64)}`;
  value.revision = revisionOf(value);
  assert.notEqual(value.revision, prior);
  assert.equal(importProfile(JSON.stringify(value)).get("surface:lesson").name, "Renamed lesson");
});

test("object-key order and whitespace do not change a snapshot digest", () => {
  const value = fixture();
  const reordered = Object.fromEntries(Object.entries(value).reverse());
  assert.equal(revisionOf(reordered), value.revision);
  assert.equal(importProfile(JSON.stringify(reordered, null, 4)).profile.revision, value.revision);
});

test("tampered snapshot is rejected instead of silently refreshed", () => {
  const value = fixture();
  value.product.name = "Changed without revision";
  assert.throws(() => importProfile(JSON.stringify(value)), /snapshot digest mismatch/);
});

rejects(
  "reject unsupported major",
  (p) => {
    p.apiVersion = "product-profile/v2";
  },
  /schema/,
);
rejects(
  "reject parallel reference schema name",
  (p) => {
    p.apiVersion = "reference-product-profile/v1";
  },
  /schema/,
  "observed-reference",
);
rejects(
  "reject unknown top-level authority field",
  (p) => {
    p.accepted = true;
  },
  /additional properties/,
);
rejects(
  "reject raw runtime state inside a profile",
  (p) => {
    p.state = { pending: [] };
  },
  /additional properties/,
);
rejects(
  "reject undeclared element fields",
  (p) => {
    p.elements[0].provider = "implicit";
  },
  /additional properties/,
);
rejects(
  "reject duplicate IDs",
  (p) => {
    p.elements.push(structuredClone(p.elements[0]));
  },
  /duplicate ID/,
);
rejects(
  "reject wrong kind prefixes",
  (p) => {
    p.elements[0].id = "state:wrong";
  },
  /must use entity: prefix/,
);
rejects(
  "reject dangling relationship targets",
  (p) => {
    p.relationships[0].to = "effect:missing";
  },
  /unresolved ID/,
);
rejects(
  "reject wrong relationship domain",
  (p) => {
    p.relationships[1].from = "surface:lesson";
  },
  /must reference system or mechanic/,
);
rejects(
  "reject claims for another subject",
  (p) => {
    p.elements[0].claimRefs = ["claim:product"];
  },
  /describes another subject/,
);
rejects(
  "reject a missing transition trigger",
  (p) => {
    delete p.elements.find((e) => e.kind === "transition").trigger;
  },
  /required property/,
);
rejects(
  "reject invalid transition endpoint types",
  (p) => {
    p.elements.find((e) => e.kind === "transition").from = "surface:lesson";
  },
  /must reference state/,
);
rejects(
  "reject disconnected journey steps",
  (p) => {
    p.elements.find((e) => e.kind === "journey").steps.push("transition:complete");
  },
  /disconnected journey/,
);
rejects(
  "reject a source ID where a journey transition belongs",
  (p) => {
    p.elements.find((e) => e.kind === "journey").steps = ["source:product"];
  },
  /must reference transition/,
);
rejects(
  "reject a rendered document as declaration authority",
  (p) => {
    p.claims[0].sourceRefs = ["source:render"];
  },
  /authored truth owner/,
);
rejects(
  "require PRODUCT.md to point back to product.yaml",
  (p) => {
    p.provenance.sources[2].derivedFrom = [];
  },
  /must reference product.yaml/,
);
rejects(
  "require immutable source digests",
  (p) => {
    delete p.provenance.sources[0].contentDigest;
  },
  /contentDigest/,
);
rejects(
  "reject inferred claims with no grounding",
  (p) => {
    Object.assign(p.claims[0], { status: "inferred", sourceRefs: [], reason: "No support" });
  },
  /needs a source or evidence/,
);
rejects(
  "reject missing uncertainty reasons",
  (p) => {
    delete p.claims.find((c) => c.status === "unknown").reason;
  },
  /reason/,
);
rejects(
  "reject unknown claims without a named unknown",
  (p) => {
    p.unknowns = [];
  },
  /explicit unknown/,
);
rejects(
  "reject missing coverage family",
  (p) => {
    p.coverage.pop();
  },
  /schema/,
);
rejects(
  "reject duplicate coverage family",
  (p) => {
    p.coverage[1].kind = p.coverage[0].kind;
  },
  /duplicate coverage kind/,
);
rejects(
  "reject omitted elements in declared coverage",
  (p) => {
    p.coverage[0].elementRefs = [];
  },
  /element omitted/,
);
rejects(
  "unknown coverage cannot be labeled complete",
  (p) => {
    p.coverage.at(-1).status = "covered";
  },
  /no unresolved unknowns/,
);
rejects(
  "inaccessible coverage requires a visible gap",
  (p) => {
    p.coverage[0].status = "inaccessible";
  },
  /explicit unknown/,
);
rejects(
  "not-applicable is not inferred from an empty list",
  (p) => {
    p.elements = p.elements.filter((e) => e.kind !== "technical-characteristic");
    Object.assign(p.coverage.at(-1), { status: "not-applicable", elementRefs: [], unknownRefs: [] });
  },
  /not-applicable needs a claim/,
);
rejects(
  "reject observations in intended profiles",
  (p) => {
    p.claims[0].status = "observed";
  },
  /belongs in an observed profile/,
);
rejects(
  "reject declarations in observed profiles",
  (p) => {
    p.claims[0].status = "declared";
  },
  /belongs in an intended profile/,
  "observed",
);
rejects(
  "observation requires direct subject evidence",
  (p) => {
    p.claims[0].evidenceRefs = ["evidence:audio"];
  },
  /direct evidence for its subject/,
  "observed",
);
rejects(
  "derived summaries cannot become original observations",
  (p) => {
    Object.assign(p.evidence[0], { directness: "derived", derivedFrom: ["evidence:audio"] });
  },
  /direct evidence/,
  "observed",
);
rejects(
  "source code is not runtime evidence",
  (p) => {
    p.provenance.sources[0].owner = "git";
  },
  /original evidence owner/,
  "observed",
);
rejects(
  "haptics require physical-device evidence",
  (p) => {
    p.evidence[2].environment = "simulator";
  },
  /haptic evidence requires a physical device/,
  "observed",
);
rejects(
  "video cannot prove haptic feedback",
  (p) => {
    p.claims.find((c) => c.subjectRef === "feedback:success").evidenceRefs = ["evidence:trace", "evidence:audio"];
  },
  /missing haptic evidence/,
  "observed",
);
rejects(
  "screenshots cannot prove motion",
  (p) => {
    p.evidence[0].modality = "image";
  },
  /motion observation needs video or measurement/,
  "observed",
);
rejects(
  "reject evidence derivation cycles",
  (p) => {
    Object.assign(p.evidence[0], { directness: "derived", derivedFrom: ["evidence:trace"] });
  },
  /derivation cycle/,
  "observed",
);
rejects(
  "reject source derivation cycles",
  (p) => {
    p.provenance.sources[0].derivedFrom = ["source:render"];
  },
  /derivation cycle/,
);
rejects(
  "reference metadata is mandatory only for reference mode",
  (p) => {
    p.extensions = {};
  },
  /required property/,
  "observed-reference",
);
rejects(
  "managed observations cannot smuggle reference metadata",
  (p) => {
    p.extensions = fixture("observed-reference").extensions;
  },
  /schema/,
  "observed",
);
rejects(
  "reference extension cannot duplicate core concepts",
  (p) => {
    p.extensions.reference.elements = p.elements;
  },
  /additional properties/,
  "observed-reference",
);
rejects(
  "reference capture provenance requires a capture owner",
  (p) => {
    p.provenance.sources[0].owner = "evidence-store";
  },
  /capture source owner/,
  "observed-reference",
);
rejects(
  "reference build identity must match the shared version",
  (p) => {
    p.extensions.reference.observedVersionRef = "version:other";
  },
  /must match product.version.id/,
  "observed-reference",
);
rejects(
  "reference capture windows cannot reverse",
  (p) => {
    p.extensions.reference.captureWindow.startedAt = "2026-09-21T12:00:00Z";
  },
  /reversed capture window/,
  "observed-reference",
);
rejects(
  "reference capture windows bind observations",
  (p) => {
    p.evidence[0].observedAt = "2026-09-19T12:00:00Z";
  },
  /outside reference capture window/,
  "observed-reference",
);
rejects(
  "reject impossible dates",
  (p) => {
    p.provenance.generatedAt = "2026-02-30T12:00:00Z";
  },
  /date-time/,
);

test("imports enforce byte and depth bounds before recursive work", () => {
  assert.throws(() => importProfile(" ".repeat(MAX_PROFILE_BYTES + 1)), /byte limit/);
  assert.throws(() => importProfile("[".repeat(33) + "0" + "]".repeat(33)), /depth limit/);
  assert.throws(() => importProfile("not JSON"), SyntaxError);
});

test("ARCH-02/07/09: production modules do not import this repository-only reference reader", () => {
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", ".wrangler"].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(?:[cm]?[jt]sx?)$/.test(file)) {
        const content = readFileSync(file, "utf8");
        assert.doesNotMatch(content, /(?:from\s*|import\s*\(|require\s*\()\s*["'][^"']*docs\/contracts\/product-profile/, file);
      }
    }
  };
  for (const layer of ["contracts", "kernel", "adapters", "entrypoints", "hosted"]) visit(path.join(root, layer));
  assert.equal(schema.$id, "urn:brigade:product-profile:v1");
});

rejects(
  "mode and producer method must agree",
  (p) => {
    p.provenance.producer.method = "observation";
  },
  /method does not match/,
);
rejects(
  "observations cannot occur after profile generation",
  (p) => {
    p.evidence[0].observedAt = "2026-09-21T12:00:00Z";
  },
  /later than profile generation/,
  "observed",
);
rejects(
  "capture cannot finish after the profile is generated",
  (p) => {
    p.extensions.reference.captureWindow.endedAt = "2026-09-21T12:00:00Z";
  },
  /ends after profile generation/,
  "observed-reference",
);
rejects(
  "unknowns cannot hide under an unrelated coverage family",
  (p) => {
    p.coverage.at(-1).unknownRefs = [];
    p.coverage.at(-1).status = "covered";
    p.coverage[0].unknownRefs = ["unknown:offline"];
    p.coverage[0].status = "partial";
  },
  /subject unknown omitted/,
);

test("reject duplicate JSON keys before normalization loses information", () => {
  const json = read("intended");
  assert.throws(() => importProfile(json.replace('"mode": "intended"', '"mode":"observed", "mode":"intended"')), /duplicate JSON key mode/);
  assert.throws(() => importProfile(json.replace('"mode": "intended"', '"mo\\u0064e":"observed", "mode":"intended"')), /duplicate JSON key mode/);
  assert.throws(() => importProfile('{"x":{"id":1,"id":2}}'), /duplicate JSON key id/);
});

test("profile and schema are immutable, while null version labels remain explicit unknown values", () => {
  assert.throws(() => schema.$defs.kind.enum.push("rogue-kind"), TypeError);
  const value = fixture();
  value.product.version.label = null;
  value.product.version.build = null;
  value.revision = revisionOf(value);
  const reader = importProfile(JSON.stringify(value));
  assert.equal(reader.get(value.id), reader.profile);
  assert.equal(reader.get(value.product.version.id).build, null);
});
