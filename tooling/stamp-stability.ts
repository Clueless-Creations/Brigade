#!/usr/bin/env node
/** Prove the stamp generators are byte-stable across two runs. */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { composeCatalog } from "../catalog/index.js";
import { renderFirstpartyPackage } from "../catalog/packs/firstparty.js";
import { renderGeneratedFiles } from "../catalog/render-routing.js";
import { computeEvidenceSchemaFingerprint } from "../kernel/schema/evidence-schema-version.js";
import { buildHostedKnowledgeBundle, serializeHostedKnowledgeBundle } from "./render-hosted-bundle.js";
import { resolveSkillRoot } from "./lib/skill-root.js";

const root = resolveSkillRoot(import.meta.url);
const failures: string[] = [];

function same(label: string, left: string, right: string): void {
  if (left !== right) failures.push(`${label} changed between two renders.`);
}

const evidenceA = JSON.stringify(computeEvidenceSchemaFingerprint(root));
const evidenceB = JSON.stringify(computeEvidenceSchemaFingerprint(root));
same("evidence-schema fingerprint", evidenceA, evidenceB);
if (evidenceA.includes("generatedAt")) failures.push("evidence-schema fingerprint still carries generatedAt.");

const routingA = JSON.stringify(renderGeneratedFiles(composeCatalog(root)));
const routingB = JSON.stringify(renderGeneratedFiles(composeCatalog(root)));
same("routing projections", routingA, routingB);

const firstpartyA = Buffer.concat(
  Object.entries(renderFirstpartyPackage(root))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, bytes]) => bytes),
).toString("base64");
const firstpartyB = Buffer.concat(
  Object.entries(renderFirstpartyPackage(root))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, bytes]) => bytes),
).toString("base64");
same("firstparty package", firstpartyA, firstpartyB);

const hostedA = serializeHostedKnowledgeBundle(buildHostedKnowledgeBundle(root));
const hostedB = serializeHostedKnowledgeBundle(buildHostedKnowledgeBundle(root));
same("hosted knowledge bundle", hostedA, hostedB);

const dir = mkdtempSync(path.join(tmpdir(), "b2c-stamp-stability-"));
try {
  const first = path.join(dir, "a.html");
  const second = path.join(dir, "b.html");
  for (const out of [first, second]) {
    const built = spawnSync(process.execPath, ["examples/spec-pack/build.mjs", "examples/spec-pack/spec.yaml", out], { cwd: root, encoding: "utf8" });
    if (built.status !== 0) failures.push(`spec-pack build failed: ${built.stderr}`);
  }
  if (failures.length === 0) {
    const htmlA = readFileSync(first, "utf8");
    const htmlB = readFileSync(second, "utf8");
    same("spec-pack index", htmlA, htmlB);
    if (!htmlA.includes("\n  ")) failures.push("spec-pack index.html still embeds JSON on one line.");
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("stamp generators are byte-stable.");
