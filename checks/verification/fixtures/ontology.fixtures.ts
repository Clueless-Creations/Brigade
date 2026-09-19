import { loadWorldOntology } from "../../../catalog/ontology/load.js";
import { isA } from "../../../catalog/ontology/query.js";
import type { WorldOntology } from "../../../catalog/ontology/types.js";
import { validateWorldOntology, validateWorldOntologyFile } from "../../../catalog/ontology/validate.js";
import { loadConceptScheme } from "../../../catalog/taxonomy/load.js";
import { assert, skillRoot, type Harness } from "./_harness.js";

function cloneOntology(): WorldOntology {
  return structuredClone(loadWorldOntology(skillRoot));
}

function workConceptIds(): Set<string> {
  return new Set(loadConceptScheme(skillRoot).concepts.map((concept) => concept.id));
}

export function register(harness: Harness): void {
  harness.check("ontology: the shipped world ontology matches its constraints", () => {
    const issues = validateWorldOntologyFile(skillRoot, workConceptIds());
    assert(issues.length === 0, issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n"));
  });

  harness.check("ontology: customer is an actor and not a feature", () => {
    const ontology = loadWorldOntology(skillRoot);
    assert(isA(ontology, "class.customer", "class.actor"), "customer should be an actor");
    assert(isA(ontology, "class.customer", "class.world-thing"), "customer should be a world thing");
    assert(!isA(ontology, "class.customer", "class.feature"), "customer is not a feature");
  });

  harness.check("ontology: a parent cycle fails closed", () => {
    const ontology = cloneOntology();
    const actor = ontology.classes.find((item) => item.id === "class.actor");
    const customer = ontology.classes.find((item) => item.id === "class.customer");
    assert(actor !== undefined && customer !== undefined, "actor and customer must exist");
    actor.parentIds = ["class.customer"];
    customer.parentIds = ["class.actor"];
    const issues = validateWorldOntology(ontology);
    assert(
      issues.some((issue) => issue.code === "catalog_ontology.class.cycle"),
      `expected cycle, got ${issues.map((issue) => issue.code).join(", ")}`,
    );
  });

  harness.check("ontology: a class with one subclass fails closed", () => {
    const ontology = cloneOntology();
    ontology.classes = ontology.classes.filter((item) => item.id !== "class.competitor");
    const issues = validateWorldOntology(ontology);
    assert(
      issues.some((issue) => issue.code === "catalog_ontology.class.single_child" && issue.message.includes("class.actor")),
      `expected single child on actor, got ${issues.map((issue) => `${issue.code}:${issue.message}`).join(" | ")}`,
    );
  });

  harness.check("ontology: a competency question naming an unknown class fails closed", () => {
    const ontology = cloneOntology();
    ontology.competencyQuestions[0] = {
      ...ontology.competencyQuestions[0]!,
      classIds: ["class.not-a-class"],
    };
    const issues = validateWorldOntology(ontology);
    assert(
      issues.some((issue) => issue.code === "catalog_ontology.question.unknown_class"),
      `expected unknown class, got ${issues.map((issue) => issue.code).join(", ")}`,
    );
  });

  harness.check("ontology: a missing operator plane fails closed", () => {
    const ontology = cloneOntology();
    ontology.planes = ontology.planes.filter((plane) => plane.id !== "plane.operator");
    const issues = validateWorldOntology(ontology);
    assert(
      issues.some((issue) => issue.code === "catalog_ontology.plane.missing" && issue.message.includes("plane.operator")),
      `expected missing operator plane, got ${issues.map((issue) => issue.code).join(", ")}`,
    );
  });
  harness.check("ontology: #519 observation class + narrow relationship slots present", () => {
    const ontology = loadWorldOntology(skillRoot);
    assert(
      ontology.classes.some((item) => item.id === "class.observation"),
      "class.observation must exist",
    );
    assert(isA(ontology, "class.observation", "class.epistemic-record"), "observation is epistemic");
    const requiredSlots = [
      "slot.observation.same-entity-as",
      "slot.observation.reports-same-failure-as",
      "slot.observation.uses-same-mechanism-as",
      "slot.evidence.contradicts",
      "slot.evidence.about",
    ];
    for (const slotId of requiredSlots) {
      assert(
        ontology.slots.some((slot) => slot.id === slotId),
        `missing slot ${slotId}`,
      );
    }
    assert(
      ontology.competencyQuestions.some((q) => q.id === "cq.11"),
      "cq.11 competency question for same-failure/mechanism",
    );
    assert(
      ontology.homonymsWithWork.some((h) => h.worldClassId === "class.observation"),
      "observation homonym keeps world ≠ work distinct",
    );
  });
}
