import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import YAML from "yaml";
import { generateIntendedProductProfile, intendedProfileIsStale, refreshIntendedProductProfile } from "./intended-product-profile.js";

const fixture = path.resolve("examples/tuck");
const withWorkspace = (run: (root: string) => void) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "brigade-profile-"));
  try { cpSync(fixture, root, { recursive: true }); run(root); } finally { rmSync(root, { recursive: true, force: true }); }
};

test("projects accepted product truth deterministically and keeps unresolved families explicit", () => withWorkspace((root) => {
  const first = generateIntendedProductProfile(root, "2026-09-20T18:00:00Z");
  const second = generateIntendedProductProfile(root, "2026-09-20T18:00:00Z");
  assert.deepEqual(first, second);
  assert.equal(first.mode, "intended");
  assert.ok(Array.isArray(first.unknowns) && first.unknowns.length > 0);
  assert.ok((first.provenance as any).sources.some((source: any) => source.owner === "product-yaml"));
}));

test("refuses product truth that is not accepted", () => withWorkspace((root) => {
  const file = path.join(root, "product.yaml");
  const product = YAML.parse(readFileSync(file, "utf8"));
  product.meta.status = "planned";
  writeFileSync(file, YAML.stringify(product));
  assert.throws(() => generateIntendedProductProfile(root, "2026-09-20T18:00:00Z"), /product_not_accepted/);
}));

test("source revision changes make the stored profile stale until refreshed", () => withWorkspace((root) => {
  refreshIntendedProductProfile(root, "2026-09-20T18:00:00Z");
  assert.equal(intendedProfileIsStale(root), false);
  const design = path.join(root, "DESIGN.md");
  writeFileSync(design, readFileSync(design, "utf8") + "\n<!-- changed -->\n");
  assert.equal(intendedProfileIsStale(root), true);
  refreshIntendedProductProfile(root, "2026-09-20T18:01:00Z");
  assert.equal(intendedProfileIsStale(root), false);
}));
