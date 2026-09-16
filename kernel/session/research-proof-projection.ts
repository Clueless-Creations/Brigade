import { existsSync, lstatSync } from "node:fs";
import path from "node:path";
import { RESEARCH_CONTRACT_EXPLANATION } from "../../contracts/public-api/research-contract.js";
import { boundedFileBytes } from "../lib/bounded-file.js";
import { parseRequiredTableSection } from "../lib/required-table-section.js";
import { PLANNING_ARTIFACT_BYTE_CAP } from "./planning-limits.js";

/**
 * Read-only research proof facts for planning resume/status (#74).
 *
 * Does not validate research packets, author decisions, or grant authority.
 * File presence and a waived path stay distinct from measured demand and from
 * independent review strength.
 */
export type OfferDecisionProjection = "absent" | "incomplete" | "run" | "waived";

export type ResearchProofProjection = {
  readonly offerDecision: OfferDecisionProjection;
  /** Unrun or incomplete offer work stays unmeasured; run or waived only names the decision path. */
  readonly demand: "unmeasured" | "path_recorded";
  readonly facts: readonly string[];
};

const OFFER_DECISION_HEADERS = ["Status", "Date", "Evidence", "Decision", "Decided by"] as const;

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

function projectOfferDecision(offerText: string | undefined): OfferDecisionProjection {
  if (offerText === undefined) return "absent";
  const decision = parseRequiredTableSection(offerText, "Decision", OFFER_DECISION_HEADERS);
  if (!decision.ok || decision.section.rows.length === 0) return "incomplete";
  const statusColumn = decision.section.header.normalizedCells.indexOf("status");
  if (statusColumn < 0) return "incomplete";
  const status = (decision.section.rows.at(-1)?.cells[statusColumn] ?? "").trim().toLowerCase();
  if (status === "run") return "run";
  if (status === "waived") return "waived";
  return "incomplete";
}

/** Derive planning-facing research proof sentences from workspace artifacts. */
export function projectResearchProof(root: string): ResearchProofProjection {
  const offerBytes = readRelativeArtifact(root, "strategy/OFFER_TEST.md");
  const researchPresent = readRelativeArtifact(root, "strategy/RESEARCH.md") !== undefined;
  const offerDecision = projectOfferDecision(offerBytes?.toString("utf8"));
  const demand: ResearchProofProjection["demand"] = offerDecision === "run" || offerDecision === "waived" ? "path_recorded" : "unmeasured";
  const facts: string[] = [];
  if (researchPresent || offerBytes) {
    facts.push(RESEARCH_CONTRACT_EXPLANATION.checkpoint.evidence);
  }
  if (demand === "unmeasured") {
    facts.push("Offer-test demand remains unmeasured until a Decision row records a run with measured results; artifact presence is structural only.");
  }
  if (offerDecision === "waived") {
    facts.push("A founder waiver changes the permitted decision path only; it does not improve evidence strength or replace independent review.");
  }
  if (offerDecision === "run") {
    facts.push("An offer-test run records an experiment path; independent review and initialization eligibility remain separate facts.");
  }
  return { offerDecision, demand, facts };
}

/** Append research proof distinctions to the planning resume next-action sentence. */
export function withResearchProofNextAction(base: string, projection: ResearchProofProjection): string {
  if (projection.facts.length === 0) return base;
  return `${base} ${projection.facts.join(" ")}`;
}
