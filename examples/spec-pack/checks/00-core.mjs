// Core spec checks. Later lanes add checks/<NN>-<area>.mjs instead of editing this file.
export const id = "core";
export const describe = "Screens, states, taps, reachability, web surfaces, events, store screenshots, approval, and tasks.";

const REQUIRED_DECISION = ["loading", "empty", "error"];
const ALLOWED = new Set(["default", "loading", "empty", "error", "offline", "permission-denied", "success"]);
const TASK_AREAS = ["App", "Web", "Store & Marketing", "Growth", "Money", "Ops"];
const TASK_AREA_SET = new Set(TASK_AREAS);

function taskId(task) {
  return typeof task?.id === "string" ? task.id : "";
}

function checkTasks(spec, ctx) {
  const errors = [];
  if (spec.tasks != null && !Array.isArray(spec.tasks)) {
    errors.push("tasks: must be a list");
    return errors;
  }
  const tasks = ctx.tasks ?? [];
  const byId = new Map();
  for (const task of tasks) {
    const id = taskId(task);
    if (!id) {
      errors.push("tasks: an entry is missing id");
      continue;
    }
    if (byId.has(id)) errors.push(`tasks: duplicate id "${id}"`);
    else byId.set(id, task);
    if (!TASK_AREA_SET.has(task.area)) {
      errors.push(`tasks: "${id}" area "${task.area ?? ""}" is not one of ${TASK_AREAS.join(", ")}`);
    }
    if (task.depends_on != null && !Array.isArray(task.depends_on)) {
      errors.push(`tasks: "${id}" depends_on must be a list`);
    }
  }
  for (const task of tasks) {
    const id = taskId(task);
    if (!id || !Array.isArray(task.depends_on)) continue;
    for (const dep of task.depends_on) {
      if (!byId.has(dep)) errors.push(`tasks: "${id}" depends_on unknown task "${dep}"`);
    }
  }
  const color = new Map();
  const stack = [];
  const visit = (id) => {
    color.set(id, "gray");
    stack.push(id);
    const task = byId.get(id);
    const deps = Array.isArray(task?.depends_on) ? task.depends_on : [];
    for (const dep of deps) {
      if (!byId.has(dep)) continue;
      const state = color.get(dep);
      if (state === "gray") {
        const at = stack.indexOf(dep);
        errors.push(`tasks: cycle ${[...stack.slice(at), dep].join(" -> ")}`);
      } else if (state !== "black") {
        visit(dep);
      }
    }
    stack.pop();
    color.set(id, "black");
  };
  for (const id of byId.keys()) {
    if (color.get(id) !== "black") visit(id);
  }
  return errors;
}

export function check(spec, ctx) {
  const errors = [];
  const ids = ctx.screenIds;
  const eventNames = ctx.eventNames;
  const reach = ctx.reach;
  for (const s of spec.screens) {
    if (!s.states?.includes("default")) errors.push(`${s.id}: states must include default`);
    for (const st of s.states ?? []) {
      if (!ALLOWED.has(st)) errors.push(`${s.id}: unknown state "${st}"`);
      if (!s.mock?.[st]?.length) errors.push(`${s.id}: state "${st}" has no mock`);
    }
    for (const st of REQUIRED_DECISION) {
      if (!s.states?.includes(st) && !s.not_applicable?.[st]) errors.push(`${s.id}: "${st}" is neither a state nor not_applicable with a reason`);
    }
    if (!s.acceptance?.length) errors.push(`${s.id}: no acceptance rules`);
    for (const e of s.events ?? []) if (!eventNames.has(e)) errors.push(`${s.id}: event "${e}" not in analytics.events`);
    for (const blocks of Object.values(s.mock ?? {})) {
      for (const b of blocks) {
        for (const target of [b.to, b.back, b.action_to]) if (target && !ids.has(target)) errors.push(`${s.id}: tap target "${target}" is not a screen`);
      }
    }
  }
  for (const sh of spec.store.screenshots) if (!ids.has(sh.screen)) errors.push(`store screenshot uses unknown screen "${sh.screen}"`);
  for (const need of ["landing", "privacy", "terms", "support", "delete"]) {
    if (!spec.web.some((w) => w.id === need)) errors.push(`web surface "${need}" is missing`);
  }
  for (const need of ["app_opened", "core_action_completed", "paywall_viewed", "purchase_completed"]) {
    if (!eventNames.has(need)) errors.push(`analytics event "${need}" is missing`);
  }
  for (const s of spec.screens) if (!reach.has(s.id)) errors.push(`${s.id}: not reachable in the prototype`);
  if (spec.meta.status === "approved" && (!spec.meta.approved_by || !spec.meta.approved_at))
    errors.push("meta: approved status needs approved_by and approved_at");
  errors.push(...checkTasks(spec, ctx));
  return errors;
}
