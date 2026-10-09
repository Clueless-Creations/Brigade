// Optional domain, default free-URL origin, and the Gate 1 tracker draft.
// build.mjs calls check() and emit(). Creating tracker issues stays a later approved step.
import { assignmentErrors } from "../assignments.mjs";
export const id = "launch-tracker";
export const describe = "Optional domain, default web_origin, and tracker-draft.json.";

export const FREE_WEB_ORIGIN = "https://<slug>.<account>.workers.dev";

export const MILESTONES = ["Build", "Dogfood", "Gate 2", "Launch", "Run"];
export const AREA_LABELS = ["App", "Web", "Store & Marketing", "Growth", "Money", "Ops"];
export const CAPABILITY_LABELS = ["Auth", "Privacy", "Security", "Deep links", "Discovery (SEO/AEO/GEO)", "Analytics", "Accessibility"];

const MILESTONE_SET = new Set(MILESTONES);
const CAPABILITY_SET = new Set(CAPABILITY_LABELS);

function taskId(task) {
  return typeof task?.id === "string" ? task.id : "";
}

function projectKey(meta) {
  if (typeof meta?.slug === "string" && meta.slug.trim()) return meta.slug.trim();
  if (typeof meta?.name === "string" && meta.name.trim()) return meta.name.trim();
  return "app";
}

export function webOriginOf(meta) {
  const value = meta?.web_origin;
  if (typeof value === "string" && value.trim()) return value.trim();
  return FREE_WEB_ORIGIN;
}

function domainOf(meta) {
  const value = meta?.domain;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function stringsOf(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string");
}

export function check(spec, ctx) {
  const errors = assignmentErrors(spec);
  const meta = spec?.meta ?? {};
  if (meta.domain != null && typeof meta.domain !== "string") errors.push("meta.domain: must be a string when set");
  if (meta.web_origin != null && typeof meta.web_origin !== "string") errors.push("meta.web_origin: must be a string when set");
  for (const task of ctx?.tasks ?? []) {
    const id = taskId(task) || "(missing id)";
    if (task.capabilities != null && !Array.isArray(task.capabilities)) {
      errors.push(`tasks: "${id}" capabilities must be a list`);
    } else {
      for (const cap of task.capabilities ?? []) {
        if (typeof cap !== "string") {
          errors.push(`tasks: "${id}" capabilities must be strings`);
          continue;
        }
        if (!CAPABILITY_SET.has(cap)) errors.push(`tasks: "${id}" capability "${cap}" is not a tracker label`);
      }
    }
    if (task.milestone != null && task.milestone !== "") {
      if (typeof task.milestone !== "string" || !MILESTONE_SET.has(task.milestone)) {
        errors.push(`tasks: "${id}" milestone is not one of ${MILESTONES.join(", ")}`);
      }
    }
  }
  return errors;
}

function milestoneOf(task) {
  return typeof task?.milestone === "string" && MILESTONE_SET.has(task.milestone) ? task.milestone : "Build";
}

export function trackerDraft(spec, ctx) {
  const meta = spec?.meta ?? {};
  const project = projectKey(meta);
  const name = typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : project;
  const issues = (ctx?.tasks ?? []).map((task) => {
    const key = taskId(task);
    const title = typeof task.title === "string" && task.title.trim() ? task.title.trim() : key;
    return {
      key,
      title,
      project,
      milestone: milestoneOf(task),
      area: typeof task.area === "string" ? task.area : "",
      capabilities: [...new Set(stringsOf(task.capabilities).filter((cap) => CAPABILITY_SET.has(cap)))],
      blockers: stringsOf(task.depends_on),
      checklist: stringsOf(task.acceptance),
      checklist_sources: stringsOf(task.checklist_sources),
      source: ctx.source,
      source_refs: stringsOf(task.source_refs),
      context: task.context ?? [],
    };
  });
  return {
    source: ctx.source,
    projects: [{ key: project, name, web_origin: webOriginOf(meta), domain: domainOf(meta) }],
    milestones: [...MILESTONES],
    labels: { area: [...AREA_LABELS], capability: [...CAPABILITY_LABELS] },
    issues,
  };
}

export function emit(spec, ctx) {
  return { "tracker-draft.json": `${JSON.stringify(trackerDraft(spec, ctx), null, 2)}\n` };
}
