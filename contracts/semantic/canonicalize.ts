import { createHash } from "node:crypto";

/** Stable JSON for plan identity: sorted object keys, array order preserved, no undefined. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function digestOf(value: unknown): string {
  return sha256Hex(canonicalize(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  const out: Record<string, unknown> = {};
  for (const [key, item] of entries) out[key] = sortValue(item);
  return out;
}
