// Project accepted declarations into assignments. This is not an execution or authority owner.
const strings = (value) => (Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : []);

export function sourceValue(spec, pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  return pointer
    .slice(1)
    .split("/")
    .reduce((value, key) => {
      const decoded = key.replace(/~1/g, "/").replace(/~0/g, "~");
      return value !== null && typeof value === "object" && Object.hasOwn(value, decoded) ? value[decoded] : undefined;
    }, spec);
}

export function deriveTasks(spec) {
  const tasks = [];
  const mergeRules = strings(spec.repo?.merge_gate);
  function creativeCriterion(asset, source) {
    const name = asset?.id || asset?.placement || "creative asset";
    return {
      text: `Prepare the declared ${name} and verify it against ${source}; preserve its specified placement, media, source and specifications.`,
      source_ref: source,
    };
  }
  function assignment(task, sourceRef, extraCriteria = [], extraContext = []) {
    const criteria = strings(task.acceptance).map((text, index) => ({ text, source_ref: `${sourceRef}/acceptance/${index}` }));
    criteria.push(...extraCriteria);
    // Area identifies normal repository work, not non-applicability for other work.
    // Every assignment retains the same conditional source context below.
    if (task.area === "App" || task.area === "Web") {
      criteria.push(
        ...mergeRules.map((text, index) => ({
          text: `For repository changes, satisfy repo.merge_gate: ${text}`,
          source_ref: `/repo/merge_gate/${index}`,
        })),
      );
    }
    const refs = [...new Set([sourceRef, ...strings(task.source_refs)])];
    return {
      ...task,
      acceptance: criteria.map((entry) => entry.text),
      checklist_sources: criteria.map((entry) => entry.source_ref),
      source_refs: refs,
      context: [
        ...(mergeRules.length
          ? [
              {
                source_ref: "/repo/merge_gate",
                when: "When this task changes repository files; apply each clause to the changed scope and record any inapplicable clause with its reason.",
                value: mergeRules,
              },
            ]
          : []),
        ...extraContext,
        ...strings(task.source_refs).map((source_ref) => ({
          source_ref,
          when: "Declared task scope; preparation does not authorize provider actions or establish acceptance.",
          value: sourceValue(spec, source_ref),
        })),
      ],
    };
  }
  for (const [index, screen] of (spec.screens ?? []).entries()) {
    const source = `/screens/${index}`;
    tasks.push(
      assignment(
        {
          id: `S-${screen.id}`,
          title: screen.title ?? screen.id,
          area: "App",
          depends_on: [],
          acceptance: screen.acceptance ?? [],
          capabilities: [],
        },
        source,
        strings(screen.states).map((state, stateIndex) => ({
          text: `Render and verify ${screen.id} in required state "${state}" against its approved mock.`,
          source_ref: `${source}/states/${stateIndex}`,
        })),
      ),
    );
  }
  for (const [index, page] of (spec.web ?? []).entries()) {
    tasks.push(
      assignment(
        {
          id: `W-${page.id}`,
          title: page.title ?? page.id,
          area: "Web",
          depends_on: [],
          acceptance: page.acceptance ?? [],
          capabilities: [],
        },
        `/web/${index}`,
      ),
    );
  }
  const explicitTasks = Array.isArray(spec.tasks) ? spec.tasks : [];
  for (const [index, task] of explicitTasks.entries()) {
    const assetCriteria = [...new Set(strings(task.source_refs))]
      .filter((ref) => /^\/store\/creative_assets\/\d+$/.test(ref) && sourceValue(spec, ref) !== undefined)
      .map((ref) => creativeCriterion(sourceValue(spec, ref), ref));
    tasks.push(assignment(task, `/tasks/${index}`, assetCriteria));
  }
  const claimed = new Set(explicitTasks.flatMap((task) => strings(task.source_refs)));
  const assets = Array.isArray(spec.store?.creative_assets) ? spec.store.creative_assets : [];
  for (const [index, asset] of assets.entries()) {
    const source = `/store/creative_assets/${index}`;
    if (claimed.has(source)) continue;
    const name = asset?.id || asset?.placement || `creative asset ${index + 1}`;
    tasks.push(
      assignment(
        {
          id: `C-${asset?.id || `store-creative-${index + 1}`}`,
          title: `Prepare ${name}`,
          area: "Store & Marketing",
          depends_on: [],
          acceptance: [],
          capabilities: [],
        },
        source,
        [creativeCriterion(asset, source)],
        [{ source_ref: source, when: "Declared creative deliverable; preparation does not authorize provider actions or establish acceptance.", value: asset }],
      ),
    );
  }
  return tasks;
}

export function assignmentErrors(spec) {
  const errors = [];
  if (spec.repo?.merge_gate != null && (!Array.isArray(spec.repo.merge_gate) || spec.repo.merge_gate.some((rule) => typeof rule !== "string"))) {
    errors.push("repo.merge_gate: must be a list of strings");
  }
  const owners = new Map();
  for (const task of Array.isArray(spec.tasks) ? spec.tasks : []) {
    if (task.source_refs == null) continue;
    if (!Array.isArray(task.source_refs) || task.source_refs.some((ref) => typeof ref !== "string")) {
      errors.push(`tasks: "${task.id}" source_refs must be a list of JSON pointers`);
      continue;
    }
    for (const ref of new Set(task.source_refs)) {
      if (sourceValue(spec, ref) === undefined) errors.push(`tasks: "${task.id}" unresolved source_ref "${ref}"`);
      if (/^\/store\/creative_assets\/\d+$/.test(ref)) {
        if (owners.has(ref)) errors.push(`tasks: "${ref}" has multiple task owners: ${owners.get(ref)}, ${task.id}`);
        else owners.set(ref, task.id);
      }
    }
  }
  return errors;
}
