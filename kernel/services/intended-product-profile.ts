import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProductInstanceDocument } from "../../catalog/ontology/instance-load.js";
import { INTENDED_PRODUCT_PROFILE_PATH, PRODUCT_PROFILE_API_VERSION, PRODUCT_PROFILE_KINDS, type ProductProfileKind } from "../../contracts/product-profile/index.js";

type Json = null | boolean | string | Json[] | { [key: string]: Json };
type Source = { id: string; owner: string; locator: string; revision: string; contentDigest: string; derivedFrom: string[] };
type Element = { id: string; kind: ProductProfileKind; name: string; claimRefs: string[] };
type Unknown = { id: string; subjectRefs: string[]; reason: "missing-source"; question: string; sourceRefs: string[]; evidenceRefs: string[] };
const sha = (value: string | Buffer) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "product";
const canonical = (value: Json): string => Array.isArray(value) ? `[${value.map(canonical).join(",")}]` : value && typeof value === "object" ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, Json>)[key]!) }`).join(",")}}` : JSON.stringify(value);
const revisionOf = (profile: Record<string, Json>) => { const { revision: _, ...payload } = profile; return sha(canonical(payload)); };
const sourceFor = (root: string, relative: string, id: string, owner: string): Source | undefined => {
  const file = path.join(root, relative); if (!existsSync(file)) return undefined;
  const digest = sha(readFileSync(file)); return { id, owner, locator: relative, revision: digest, contentDigest: digest, derivedFrom: [] };
};
const classKind = (classId: string): ProductProfileKind | undefined => {
  if (classId === "class.screen") return "surface";
  if (classId === "class.flow") return "system";
  if (["class.feature", "class.requirement", "class.core-loop"].includes(classId)) return "mechanic";
  if (["class.customer","class.problem","class.promise","class.wedge","class.offer","class.price","class.entitlement","class.metric","class.risk","class.decision"].includes(classId)) return "entity";
  return undefined;
};
const elementId = (kind: ProductProfileKind, sourceId: string) => `${kind}:${slug(sourceId)}`;

export function intendedProfileIsStale(root: string): boolean {
  const target = path.join(root, INTENDED_PRODUCT_PROFILE_PATH); if (!existsSync(target)) return true;
  try {
    const profile = JSON.parse(readFileSync(target, "utf8")) as { provenance?: { sources?: Source[] } };
    const sources = profile.provenance?.sources ?? [];
    for (const [relative, id] of [["product.yaml","source:product"],["DESIGN.md","source:design"]] as const) {
      const file = path.join(root, relative), prior = sources.find((source) => source.id === id);
      const eligible = relative === "DESIGN.md"
        ? existsSync(file) && /^Status:\s*accepted\b/im.test(readFileSync(file, "utf8"))
        : existsSync(file);
      if (eligible !== Boolean(prior)) return true;
      if (prior && sha(readFileSync(file)) !== prior.contentDigest) return true;
    }
    return false;
  } catch { return true; }
}

export function generateIntendedProductProfile(root: string, generatedAt = new Date().toISOString()): Record<string, Json> {
  const product = loadProductInstanceDocument(path.join(root, "product.yaml"));
  if (product.meta.status !== "accepted") throw new Error("product_profile.product_not_accepted");
  const productSource = sourceFor(root, "product.yaml", "source:product", "product-yaml")!;
  const designSource = sourceFor(root, "DESIGN.md", "source:design", "design-md");
  const designText = designSource ? readFileSync(path.join(root, "DESIGN.md"), "utf8") : "";
  const designAccepted = /^Status:\s*accepted\b/im.test(designText);
  const sources: Source[] = [productSource, ...(designSource && designAccepted ? [designSource] : [])];
  const elements: Element[] = [], claims: Record<string, Json>[] = [];
  for (const instance of product.instances) {
    const kind = classKind(instance.classId); if (!kind) continue;
    const id = elementId(kind, instance.id), claimId = `claim:${slug(instance.id)}`;
    const slots = Object.entries(instance.slots).sort(([a],[b]) => a.localeCompare(b)).map(([key, values]) => `${key}=${(values ?? []).join(",")}`).join("; ");
    elements.push({ id, kind, name: instance.id, claimRefs: [claimId] });
    claims.push({ id: claimId, subjectRef: id, statement: `Accepted ${instance.classId} ${instance.id}${slots ? `: ${slots}` : ""}.`, status: "declared", sourceRefs: [productSource.id], evidenceRefs: [] });
  }
  if (designAccepted && designSource) {
    elements.push({ id: "visual-foundation:design-system", kind: "visual-foundation", name: product.meta.name + " design system", claimRefs: ["claim:design-system"] });
    claims.push({ id: "claim:design-system", subjectRef: "visual-foundation:design-system", statement: "Accepted DESIGN.md defines the global experience and design system.", status: "declared", sourceRefs: [designSource.id], evidenceRefs: [] });
  }
  const productId = `product:${slug(product.meta.slug ?? product.meta.name)}`;
  claims.unshift({ id: "claim:product", subjectRef: productId, statement: product.meta.description, status: "declared", sourceRefs: [productSource.id], evidenceRefs: [] });
  const unknowns: Unknown[] = [];
  const coverage = PRODUCT_PROFILE_KINDS.map((kind) => {
    const refs = elements.filter((element) => element.kind === kind).map((element) => element.id);
    if (refs.length) return { id: `coverage:${kind}`, kind, scope: "Accepted authored Brigade truth available to the deterministic intended-profile projector.", status: "covered", elementRefs: refs, claimRefs: [], unknownRefs: [] };
    const unknownId = `unknown:${kind}`;
    unknowns.push({ id: unknownId, subjectRefs: [`coverage:${kind}`], reason: "missing-source", question: `Which accepted authored source defines ${kind} for this product?`, sourceRefs: [productSource.id], evidenceRefs: [] });
    return { id: `coverage:${kind}`, kind, scope: "Accepted authored Brigade truth available to the deterministic intended-profile projector.", status: "unknown", elementRefs: [], claimRefs: [], unknownRefs: [unknownId] };
  });
  const profile: Record<string, Json> = {
    apiVersion: PRODUCT_PROFILE_API_VERSION, id: `profile:${slug(product.meta.slug ?? product.meta.name)}-intended`, revision: "sha256:" + "0".repeat(64), mode: "intended",
    product: { id: productId, name: product.meta.name, version: { id: `version:${slug(product.meta.version)}`, label: product.meta.version, build: null }, claimRefs: ["claim:product"] },
    provenance: { generatedAt, producer: { id: "brigade:intended-profile", version: "1", method: "projection" }, sources },
    elements, relationships: [], claims, evidence: [], coverage, unknowns, extensions: {},
  };
  profile.revision = revisionOf(profile); return profile;
}

export function refreshIntendedProductProfile(root: string, generatedAt?: string) {
  const staleBeforeWrite = intendedProfileIsStale(root), profile = generateIntendedProductProfile(root, generatedAt);
  const target = path.join(root, INTENDED_PRODUCT_PROFILE_PATH); mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(profile, null, 2) + "\n", "utf8");
  return { profile, path: target, staleBeforeWrite };
}

function main(): void {
  const argv = process.argv.slice(2), at = argv.indexOf("--workspace");
  if (at < 0 || !argv[at + 1]) throw new Error("usage: b2c profile-refresh --workspace <path> [--json]");
  const result = refreshIntendedProductProfile(path.resolve(argv[at + 1]!));
  process.stdout.write(argv.includes("--json") ? JSON.stringify({ path: result.path, revision: result.profile.revision, staleBeforeWrite: result.staleBeforeWrite }) + "\n" : `Wrote ${result.path}\n`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
