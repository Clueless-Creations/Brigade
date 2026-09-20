import { existsSync, lstatSync } from "node:fs";
import path from "node:path";
import { parseProductInstanceDocument } from "../../catalog/ontology/instance-load.js";
import { boundedFileBytes } from "../lib/bounded-file.js";
import { PLANNING_ARTIFACT_BYTE_CAP } from "./planning-limits.js";
import YAML from "yaml";

/**
 * Read-only research *lifecycle* checkpoint facts for planning resume (#395).
 *
 * Distinct from #74 research-proof projection (evidence strength / offer demand).
 * Does not author decisions, grant authority, initialize, or rewrite proof semantics.
 * A valid Pivot/Kill checkpoint is held — never treated as malformed research to "fix" by inventing Go.
 */
export type ResearchCheckpointVerdict = "Go" | "Pivot" | "Kill";

export type ResearchCheckpointProjection = {
  readonly verdict: ResearchCheckpointVerdict | null;
  readonly recordedVia: "product_decision_log" | "absent";
  /** This projection never grants initialization; eligibility stays with bootstrap/accepted product. */
  readonly initializationEligible: false;
  readonly facts: readonly string[];
};

function readRelativeArtifact(root: string, relative: string): Buffer | undefined {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).some((part) => !part || part === "." || part === "..")) {
    throw new Error("business.unsafe_planning_artifact");
  }
  let file = path.resolve(root);
  for (const part of relative.split("/")) {
    file = path.join(file, part);
    if (existsSync(file) && lstatSync(file).isSymbolicLink()) throw new Error("business.unsafe_planning_artifact");
  }
  return existsSync(file) ? boundedFileBytes(file, PLANNING_ARTIFACT_BYTE_CAP) : undefined;
}

/** Latest structurally recognizable Go/Pivot/Kill cell in the canonical product decision log. */
function latestDecisionLogVerdict(decisionLog: string): ResearchCheckpointVerdict | null {
  const recognized: ResearchCheckpointVerdict[] = [];
  for (const line of decisionLog.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    for (const cell of cells) {
      if (cell === "Go" || cell === "Pivot" || cell === "Kill") {
        recognized.push(cell);
        break;
      }
    }
  }
  return recognized.at(-1) ?? null;
}

function factsFor(verdict: ResearchCheckpointVerdict | null): string[] {
  if (verdict === "Pivot") {
    return [
      "Research checkpoint verdict is Pivot: records are held, not malformed.",
      "Initialization remains held until an explicit Go continuation is recorded and the accepted product meets current initialization requirements.",
      "Use b2c research-decision to preview/apply one revision-bound continuation; do not invent Go or treat an unrun experiment as waived.",
    ];
  }
  if (verdict === "Kill") {
    return [
      "Research checkpoint verdict is Kill: the idea is wound down pre-build.",
      "Initialization remains held; do not convert Kill into Go or restart automatically.",
      "Use b2c research-decision only for an explicit new founder-authorized checkpoint if direction genuinely restarts.",
    ];
  }
  if (verdict === "Go") {
    return [
      "Research checkpoint verdict is Go: checkpoint validity is distinct from initialization eligibility and from evidence strength.",
      "Initialization still requires the accepted product, applicable policy, independent review, and any permitted risk acceptance.",
    ];
  }
  return [
    "No Go/Pivot/Kill checkpoint is recorded yet in the product decision log.",
    "Validate research artifacts, then record one guarded decision with b2c research-decision before initialization.",
  ];
}

/** Derive planning-facing research checkpoint facts from the canonical product decision log. */
export function projectResearchCheckpoint(root: string): ResearchCheckpointProjection {
  const productBytes = readRelativeArtifact(root, "product.yaml");
  if (!productBytes) {
    return { verdict: null, recordedVia: "absent", initializationEligible: false, facts: factsFor(null) };
  }
  let verdict: ResearchCheckpointVerdict | null = null;
  try {
    const document = YAML.parseDocument(productBytes.toString("utf8"), { uniqueKeys: true, strict: true });
    if (document.errors.length) {
      return {
        verdict: null,
        recordedVia: "absent",
        initializationEligible: false,
        facts: [
          "product.yaml is not a usable decision-log source until structural errors are repaired; an older Go does not win because a later row is malformed.",
        ],
      };
    }
    const product = parseProductInstanceDocument(document.toJS({ maxAliasCount: 0 }));
    verdict = latestDecisionLogVerdict(product.copy.decisionLog);
  } catch {
    return {
      verdict: null,
      recordedVia: "absent",
      initializationEligible: false,
      facts: ["product.yaml could not be read as a product decision log; checkpoint validity remains separate from initialization eligibility."],
    };
  }
  return {
    verdict,
    recordedVia: verdict ? "product_decision_log" : "absent",
    initializationEligible: false,
    facts: factsFor(verdict),
  };
}

/** Append lifecycle checkpoint distinctions to the planning resume next-action sentence. */
export function withResearchCheckpointNextAction(base: string, projection: ResearchCheckpointProjection): string {
  if (projection.facts.length === 0) return base;
  return `${base} ${projection.facts.join(" ")}`;
}
