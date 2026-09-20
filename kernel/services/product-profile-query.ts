import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INTENDED_PRODUCT_PROFILE_PATH } from "../../contracts/product-profile/index.js";

export const PRODUCT_PROFILE_QUERY_SCHEMA_VERSION = 1 as const;
export type ProductProfileSelector = "intended" | "observed" | "delta";
export interface ProductProfileQuery {
  selector?: ProductProfileSelector;
  ids?: readonly string[];
  text?: string;
  includeEvidence?: boolean;
  maxRecords?: number;
  maxChars?: number;
}
export interface ProductProfileProjection {
  schemaVersion: 1;
  selector: ProductProfileSelector;
  profile: { id: string; revision: string; mode: string; productVersionId: string };
  records: readonly unknown[];
  provenance: readonly unknown[];
  evidence: readonly unknown[];
  omitted: { records: number; evidence: number; truncated: boolean };
}

const words = (value: string) => new Set(value.toLowerCase().match(/[a-z0-9][a-z0-9._-]*/g) ?? []);
const recordText = (record: any) => [record.id, record.name, record.statement, record.question, record.kind].filter(Boolean).join(" ").toLowerCase();
const idsOf = (record: any): string[] => {
  const out: string[] = [];
  for (const [key,value] of Object.entries(record ?? {})) {
    if (key === "id") continue;
    if (key.endsWith("Ref") && typeof value === "string") out.push(value);
    if (key.endsWith("Refs") && Array.isArray(value)) out.push(...value.filter((item): item is string => typeof item === "string"));
  }
  return out;
};
function load(root: string, selector: ProductProfileSelector): any {
  if (selector !== "intended") throw new Error(`product_profile.selector_unavailable:${selector}`);
  return JSON.parse(readFileSync(path.join(root, INTENDED_PRODUCT_PROFILE_PATH), "utf8"));
}
export function queryProductProfile(root: string, query: ProductProfileQuery): ProductProfileProjection {
  const selector = query.selector ?? "intended", profile = load(root, selector);
  const maxRecords = Math.min(Math.max(query.maxRecords ?? 24, 1), 100);
  const maxChars = Math.min(Math.max(query.maxChars ?? 12000, 512), 64000);
  const all = [profile.product, ...profile.elements, ...profile.relationships, ...profile.claims, ...profile.coverage, ...profile.unknowns];
  const byId = new Map(all.map((record: any) => [record.id, record]));
  const seed = new Set<string>();
  for (const id of query.ids ?? []) if (byId.has(id)) seed.add(id);
  const terms = words(query.text ?? "");
  if (terms.size) for (const record of all) {
    const text = recordText(record);
    if ([...terms].some((term) => text.includes(term))) seed.add(record.id);
  }
  if (!seed.size && !query.ids?.length && !terms.size) seed.add(profile.product.id);
  const selected = new Set(seed), queue = [...seed];
  while (queue.length && selected.size < maxRecords) {
    const id = queue.shift()!, record = byId.get(id);
    if (!record) continue;
    for (const linked of idsOf(record)) if (byId.has(linked) && !selected.has(linked)) { selected.add(linked); queue.push(linked); if (selected.size >= maxRecords) break; }
    for (const candidate of all) if (selected.size < maxRecords && idsOf(candidate).includes(id) && !selected.has(candidate.id)) { selected.add(candidate.id); queue.push(candidate.id); }
  }
  let records = all.filter((record: any) => selected.has(record.id));
  const sourceIds = new Set(records.flatMap((record: any) => (record.sourceRefs ?? []) as string[]));
  const provenance = profile.provenance.sources.filter((source: any) => sourceIds.has(source.id));
  const evidenceIds = new Set(records.flatMap((record: any) => (record.evidenceRefs ?? []) as string[]));
  const evidence = query.includeEvidence ? profile.evidence.filter((item: any) => evidenceIds.has(item.id)) : [];
  let truncated = selected.size >= maxRecords, serialized = JSON.stringify({ records, provenance, evidence });
  while (serialized.length > maxChars && records.length > 1) { records = records.slice(0,-1); truncated = true; serialized = JSON.stringify({ records, provenance, evidence }); }
  return {
    schemaVersion: PRODUCT_PROFILE_QUERY_SCHEMA_VERSION, selector,
    profile: { id: profile.id, revision: profile.revision, mode: profile.mode, productVersionId: profile.product.version.id },
    records, provenance, evidence,
    omitted: { records: all.length - records.length, evidence: query.includeEvidence ? profile.evidence.length - evidence.length : evidenceIds.size, truncated },
  };
}
function main(): void {
  const argv=process.argv.slice(2), at=argv.indexOf("--workspace");
  if(at<0||!argv[at+1]) throw new Error("usage: b2c profile-query --workspace <path> [--id <stable-id>] [--query <text>] [--selector intended|observed|delta] [--include-evidence] [--max-records N] [--max-chars N]");
  const value=(flag:string)=>{const i=argv.indexOf(flag);return i>=0?argv[i+1]:undefined};
  const result=queryProductProfile(path.resolve(argv[at+1]!),{selector:(value("--selector") as ProductProfileSelector|undefined),ids:value("--id")?[value("--id")!]:undefined,text:value("--query"),includeEvidence:argv.includes("--include-evidence"),maxRecords:value("--max-records")?Number(value("--max-records")):undefined,maxChars:value("--max-chars")?Number(value("--max-chars")):undefined});
  process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
