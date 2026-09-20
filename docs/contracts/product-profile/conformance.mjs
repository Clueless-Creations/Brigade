// Repository-only contract reference. Runtime services must not import docs.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

export const MAX_PROFILE_BYTES = 2_000_000;
export const schema = freeze(JSON.parse(readFileSync(new URL("./product-profile.v1.schema.json", import.meta.url), "utf8")));
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
// UTC subset of RFC 3339. Check the calendar date, not only the string shape.
ajv.addFormat("date-time", (value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const date = new Date(value);
  const normalized = value.includes(".") ? value : value.replace("Z", ".000Z");
  return Number.isFinite(date.valueOf()) && date.toISOString() === normalized;
});
const validateShape = ajv.compile(schema);

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Canonical JSON hash without revision. Arrays retain order. This is not a signature. */
export function revisionOf(profile) {
  const { revision: _revision, ...payload } = profile;
  return `sha256:${createHash("sha256").update(canonical(payload), "utf8").digest("hex")}`;
}

function acyclic(group, fail) {
  const pending = new Map(group.map((item) => [item.id, item.derivedFrom.length]));
  const children = new Map();
  for (const item of group)
    for (const parent of item.derivedFrom) {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(item.id);
    }
  const ready = [...pending].filter(([, count]) => count === 0).map(([id]) => id);
  for (let index = 0; index < ready.length; index++) {
    const id = ready[index];
    pending.delete(id);
    for (const child of children.get(id) ?? []) {
      const count = pending.get(child) - 1;
      pending.set(child, count);
      if (count === 0) ready.push(child);
    }
  }
  if (pending.size) fail("source/evidence derivation cycle or unresolved parent");
}

/** Checks structure and references. Does not fetch sources or accept any factual claim. */
export function validateProfile(profile) {
  if (!validateShape(profile)) return validateShape.errors.map((e) => `schema ${e.instancePath}: ${e.message}`);
  const errors = [];
  const fail = (message) => errors.push(message);
  const records = new Map();
  const add = (record, type) => {
    if (records.has(record.id)) fail(`duplicate ID ${record.id}`);
    if (!record.id.startsWith(`${type}:`)) fail(`ID ${record.id} must use ${type}: prefix`);
    records.set(record.id, { record, type });
  };
  add(profile, "profile");
  add(profile.product, "product");
  add(profile.product.version, "version");
  for (const source of profile.provenance.sources) add(source, "source");
  for (const element of profile.elements) add(element, element.kind);
  for (const [field, type] of Object.entries({
    relationships: "relationship",
    claims: "claim",
    evidence: "evidence",
    coverage: "coverage",
    unknowns: "unknown",
  })) {
    for (const record of profile[field]) add(record, type);
  }
  const get = (id, types, at) => {
    const entry = records.get(id);
    if (!entry) {
      fail(`${at}: unresolved ID ${id}`);
      return undefined;
    }
    if (types && !types.includes(entry.type)) {
      fail(`${at}: ${id} must reference ${types.join(" or ")}`);
      return undefined;
    }
    return entry.record;
  };
  const sourceRefs = (ids, at) => ids.map((id) => get(id, ["source"], at)).filter(Boolean);
  const evidenceRefs = (ids, at) => ids.map((id) => get(id, ["evidence"], at)).filter(Boolean);
  const kinds = schema.$defs.kind.enum;
  const subjectTypes = ["product", "version", "relationship", "coverage", ...kinds];
  const claimRefs = (record) => {
    for (const id of record.claimRefs) {
      const claim = get(id, ["claim"], record.id);
      if (claim && claim.subjectRef !== record.id) fail(`${record.id}: claim ${id} describes another subject`);
    }
  };
  claimRefs(profile.product);
  for (const element of profile.elements) {
    claimRefs(element);
    if (element.kind === "transition") {
      get(element.from, ["state"], element.id);
      get(element.to, ["state"], element.id);
      get(element.trigger, ["event"], element.id);
    }
    if (element.kind === "journey") {
      const steps = element.steps.map((id) => get(id, ["transition"], element.id));
      for (let i = 1; i < steps.length; i++) {
        if (steps[i - 1] && steps[i] && steps[i - 1].to !== steps[i].from) fail(`${element.id}: disconnected journey steps`);
      }
    }
  }
  const relationTypes = {
    renders: [
      ["surface", "component"],
      ["state", "component", "content-pattern", "visual-foundation"],
    ],
    causes: [
      ["event", "transition", "effect", "mechanic"],
      ["effect", "event", "state"],
    ],
    persists: [
      ["system", "mechanic"],
      ["entity", "state"],
    ],
    emits: [
      ["event", "transition", "effect", "system", "mechanic"],
      ["event", "feedback"],
    ],
    navigates: [
      ["navigation-pattern", "gesture-family", "transition"],
      ["surface", "state"],
    ],
    governs: [["system", "mechanic", "visual-foundation", "navigation-pattern", "motion-family", "gesture-family", "content-pattern"], kinds],
  };
  for (const relationship of profile.relationships) {
    claimRefs(relationship);
    get(relationship.from, relationTypes[relationship.kind]?.[0] ?? kinds, relationship.id);
    get(relationship.to, relationTypes[relationship.kind]?.[1] ?? kinds, relationship.id);
  }
  const expectedMethod = { intended: "projection", observed: "observation", "observed-reference": "dissection" }[profile.mode];
  if (profile.provenance.producer.method !== expectedMethod) fail("mode: producer method does not match profile mode");
  const authored = ["product-yaml", "design-md", "authored-contract"];
  for (const source of profile.provenance.sources) {
    const parents = sourceRefs(source.derivedFrom, source.id);
    if (source.owner === "rendered-product-md" && !parents.some((parent) => parent.owner === "product-yaml")) {
      fail(`${source.id}: rendered PRODUCT.md must reference product.yaml`);
    }
  }
  for (const evidence of profile.evidence) {
    const source = get(evidence.sourceRef, ["source"], evidence.id);
    if (source && !["evidence-store", "reference-capture"].includes(source.owner)) fail(`${evidence.id}: original evidence owner required`);
    for (const id of evidence.subjectRefs) get(id, subjectTypes, evidence.id);
    if (Date.parse(evidence.observedAt) > Date.parse(profile.provenance.generatedAt)) fail(`${evidence.id}: observation is later than profile generation`);
    evidenceRefs(evidence.derivedFrom, evidence.id);
    if ((evidence.directness === "direct") !== (evidence.derivedFrom.length === 0)) fail(`${evidence.id}: invalid evidence derivation`);
    if (evidence.modality === "haptic" && evidence.environment !== "physical-device") fail(`${evidence.id}: haptic evidence requires a physical device`);
  }
  for (const claim of profile.claims) {
    const subject = get(claim.subjectRef, subjectTypes, claim.id);
    const sources = sourceRefs(claim.sourceRefs, claim.id);
    const evidence = evidenceRefs(claim.evidenceRefs, claim.id);
    if (claim.status === "declared" && !sources.some((s) => authored.includes(s.owner))) fail(`${claim.id}: declaration needs an authored truth owner`);
    if (profile.mode === "intended" && ["observed", "contradicted"].includes(claim.status)) fail(`${claim.id}: observation belongs in an observed profile`);
    if (profile.mode !== "intended" && claim.status === "declared") fail(`${claim.id}: declaration belongs in an intended profile`);
    if (["observed", "contradicted"].includes(claim.status)) {
      const direct = evidence.filter((e) => e.directness === "direct" && e.subjectRefs.includes(claim.subjectRef));
      if (!direct.length) fail(`${claim.id}: observation needs direct evidence for its subject`);
      if (subject?.kind === "feedback") {
        for (const channel of subject.channels.filter((c) => c !== "visual")) {
          if (!direct.some((e) => e.modality === channel)) fail(`${claim.id}: missing ${channel} evidence`);
        }
      }
      if (subject?.kind === "motion-family" && !direct.some((e) => ["video", "measurement"].includes(e.modality))) {
        fail(`${claim.id}: motion observation needs video or measurement evidence`);
      }
    }
    if (claim.status === "inferred" && !sources.length && !evidence.length) fail(`${claim.id}: inference needs a source or evidence reference`);
    if (claim.status === "unknown" && !profile.unknowns.some((u) => u.subjectRefs.includes(claim.subjectRef)))
      fail(`${claim.id}: unknown claim needs an explicit unknown`);
  }
  const coveredKinds = new Set();
  for (const coverage of profile.coverage) {
    if (coveredKinds.has(coverage.kind)) fail(`duplicate coverage kind ${coverage.kind}`);
    coveredKinds.add(coverage.kind);
    claimRefs(coverage);
    for (const id of coverage.elementRefs) get(id, [coverage.kind], coverage.id);
    for (const element of profile.elements.filter((e) => e.kind === coverage.kind)) {
      if (!coverage.elementRefs.includes(element.id)) fail(`${coverage.id}: element omitted from coverage ${element.id}`);
    }
    for (const id of coverage.unknownRefs) get(id, ["unknown"], coverage.id);
    for (const unknown of profile.unknowns) {
      if (unknown.subjectRefs.some((id) => id === coverage.id || coverage.elementRefs.includes(id)) && !coverage.unknownRefs.includes(unknown.id)) {
        fail(`${coverage.id}: subject unknown omitted from coverage ${unknown.id}`);
      }
    }
    if (coverage.status === "not-applicable" && coverage.claimRefs.some((id) => !["declared", "observed"].includes(records.get(id)?.record.status))) {
      fail(`${coverage.id}: not-applicable requires a declared or observed claim`);
    }
    if (["partial", "unknown", "inaccessible"].includes(coverage.status) && !coverage.unknownRefs.length) fail(`${coverage.id}: missing explicit unknown`);
    if (coverage.status === "covered" && (!coverage.elementRefs.length || coverage.unknownRefs.length))
      fail(`${coverage.id}: covered scope must contain elements and no unresolved unknowns`);
    if (coverage.status === "not-applicable" && (coverage.elementRefs.length || !coverage.claimRefs.length || coverage.unknownRefs.length))
      fail(`${coverage.id}: not-applicable needs a claim, no elements, and no unknowns`);
  }
  for (const kind of kinds) if (!coveredKinds.has(kind)) fail(`missing coverage ${kind}`);
  for (const unknown of profile.unknowns) {
    for (const id of unknown.subjectRefs) get(id, subjectTypes, unknown.id);
    sourceRefs(unknown.sourceRefs, unknown.id);
    evidenceRefs(unknown.evidenceRefs, unknown.id);
    if (!profile.coverage.some((c) => c.unknownRefs.includes(unknown.id))) fail(`${unknown.id}: unknown omitted from coverage`);
  }
  acyclic(profile.provenance.sources, fail);
  acyclic(profile.evidence, fail);
  if (profile.mode === "observed-reference") {
    const reference = profile.extensions.reference;
    if (profile.provenance.producer.method !== "dissection") fail("reference: dissection provenance required");
    for (const source of sourceRefs(reference.captureSourceRefs, "reference")) {
      if (source.owner !== "reference-capture") fail("reference: capture source owner required");
    }
    if (reference.observedVersionRef !== profile.product.version.id) fail("reference: observed version must match product.version.id");
    if (Date.parse(reference.captureWindow.startedAt) > Date.parse(reference.captureWindow.endedAt)) fail("reference: reversed capture window");
    if (Date.parse(reference.captureWindow.endedAt) > Date.parse(profile.provenance.generatedAt))
      fail("reference: capture window ends after profile generation");
    for (const evidence of profile.evidence) {
      if (
        Date.parse(evidence.observedAt) < Date.parse(reference.captureWindow.startedAt) ||
        Date.parse(evidence.observedAt) > Date.parse(reference.captureWindow.endedAt)
      ) {
        fail(`${evidence.id}: observation outside reference capture window`);
      }
    }
  }
  if (profile.revision !== revisionOf(profile)) fail("revision: snapshot digest mismatch");
  return errors;
}

function freeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}

/** In-memory contract reader, not the #567 runtime API. Does not resolve any source locator. */
export function importProfile(json) {
  if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > MAX_PROFILE_BYTES) throw new Error("profile import exceeds byte limit or is not JSON text");
  // Reject duplicate keys (including escaped spellings) and excessive nesting before parsing.
  const stack = [];
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (char === '"') {
      const start = i;
      for (i++; i < json.length; i++) {
        if (json[i] === "\\") i++;
        else if (json[i] === '"') break;
      }
      let next = i + 1;
      while (/\s/.test(json[next] ?? "x")) next++;
      if (json[next] === ":" && stack.at(-1) instanceof Set) {
        const key = JSON.parse(json.slice(start, i + 1));
        if (stack.at(-1).has(key)) throw new Error(`duplicate JSON key ${key}`);
        stack.at(-1).add(key);
      }
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? new Set() : null);
      if (stack.length > 32) throw new Error("profile import exceeds depth limit");
    } else if (char === "}" || char === "]") stack.pop();
  }
  const profile = JSON.parse(json);
  const errors = validateProfile(profile);
  if (errors.length) throw new Error(errors.join("\n"));
  freeze(profile);
  const records = [
    profile,
    profile.product,
    profile.product.version,
    ...profile.provenance.sources,
    ...profile.elements,
    ...profile.relationships,
    ...profile.claims,
    ...profile.evidence,
    ...profile.coverage,
    ...profile.unknowns,
  ];
  const index = new Map(records.map((record) => [record.id, record]));
  return Object.freeze({ profile, get: (id) => index.get(id) ?? null, export: () => JSON.stringify(profile) });
}
