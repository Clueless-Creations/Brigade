import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { composeAuthoredCatalog } from "../../catalog/authoring.js";
import { composeCatalog } from "../../catalog/index.js";
import { publicBusinessAreas } from "../../catalog/areas.js";
import { referencesForTask, renderTaskSkillFiles, skillDirectory, taskSkills, workflowsForTask } from "../../catalog/task-skills.js";
import { collectTaskSkillPackage, writeTaskSkillPackage } from "../../tooling/export-task-skill.js";
import { renderTaskSkills, replaceGeneratedBlock, taskSkillProjections } from "../../tooling/render-task-skills.js";
import { driftIsLoose, resolveDriftMode } from "../../tooling/lib/stamp-mode.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const catalog = composeAuthoredCatalog(root);
const revision = "1971c5d1e6f2c1aed38dde1ec8debc2c459be69d";
const hash = (text: string): string => createHash("sha256").update(text).digest("hex");
const scratchRoot = path.join(root, ".tmp-task-skill-checks");
function mkScratch(prefix: string): string {
  mkdirSync(scratchRoot, { recursive: true });
  return mkdtempSync(path.join(scratchRoot, prefix));
}
function focusedMethodSnippet(skill: (typeof taskSkills)[number]): string {
  if (!skill.method) return "";
  const sources = referencesForTask(catalog, skill);
  const reference = sources.find((candidate) => candidate.id === skill.method!.referenceId);
  if (!reference) return "";
  const source = readFileSync(path.join(root, reference.path), "utf8");
  const lines = source.split(/\r?\n/gu);
  const heading = lines.findIndex((line) => /^#{1,6} /u.test(line) && line.replace(/^#{1,6} /u, "").trim() === skill.method!.heading);
  if (heading < 0) return "";
  const end = lines.findIndex((line, index) => index > heading && /^#{1,6} /u.test(line));
  return lines
    .slice(heading + 1, end < 0 ? lines.length : end)
    .join("\n")
    .trim();
}

void test("six public areas cover business domains without changing internal authority groups", () => {
  assert.deepEqual(
    publicBusinessAreas.map((area) => area.name),
    ["Opportunity", "Product", "Experience", "Engineering", "Revenue and growth", "Learning and operations"],
  );
  const mapped = new Set(publicBusinessAreas.flatMap((area) => [...area.domainIds]));
  for (const domain of catalog.domains) if (domain.slug !== "machine") assert.ok(mapped.has(domain.id), domain.id);
  assert.ok(!mapped.has("domain.machine"));
  assert.ok(catalog.areas.some((area) => area.id === "area.operating-system"));
});

void test("task methods project real workflow contracts without mutating the catalog", () => {
  const before = JSON.stringify(catalog);
  const files = renderTaskSkillFiles(catalog);
  assert.equal(new Set(taskSkills.map((skill) => skill.name)).size, taskSkills.length);
  assert.equal(taskSkills.filter((skill) => skill.method).length, taskSkills.length, "all task skills now use focused methods");
  for (const name of ["b2c-research-opportunity", "b2c-design-onboarding", "b2c-review-monetization"]) {
    assert.ok(taskSkills.some((skill) => skill.name === name));
  }
  for (const skill of taskSkills) {
    const body = files[`${skillDirectory(skill)}/SKILL.md`]!;
    const frontmatter = parse(body.split("---")[1]!);
    assert.equal(frontmatter.name, skill.name);
    assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(frontmatter.name));
    assert.ok(frontmatter.name.length <= 64);
    assert.ok(frontmatter.description.length <= 1024);
    assert.equal(frontmatter["allowed-tools"], undefined);
    assert.ok(body.split("\n").length < 150);
    assert.ok(Buffer.byteLength(body) < 8000, `${skill.name} startup context grew`);
    if (skill.method) {
      const method = focusedMethodSnippet(skill);
      assert.ok(method, `focused method is missing for ${skill.name}`);
      assert.ok(body.includes(method.slice(0, 160)), `focused method is not embedded in ${skill.name}`);
    }
    assert.doesNotMatch(body, /\bmcp__\b|claude -p|codex exec/u);
    assert.match(body, /A review is read-only/);
    assert.match(body, /Treat specialty concerns as applicability rules/);
    assert.match(body, /business-status then business-plan/);
    assert.match(body, /Do not record business completion/);
    assert.ok(referencesForTask(catalog, skill).length > 0);
  }
  assert.equal(JSON.stringify(catalog), before);
});

void test("one onboarding skill preserves the internal group without requiring every stage on startup", () => {
  const skill = taskSkills.find((entry) => entry.groupId)!;
  const workflows = workflowsForTask(catalog, skill);
  assert.equal(workflows.length, 23);
  const files = renderTaskSkillFiles(catalog);
  assert.match(files[`${skillDirectory(skill)}/SKILL.md`]!, /audit or small change does not imply a full rebuild/);
  assert.equal((files[`${skillDirectory(skill)}/references/stages.md`]!.match(/\| \[Onboarding ONB-/gu) ?? []).length, 23);
});


void test("plan-implementation method keeps specialty concerns conditional", () => {
  const skill = taskSkills.find((entry) => entry.name === "b2c-plan-implementation")!;
  const method = focusedMethodSnippet(skill);
  assert.match(method, /Specialty concerns \(only when implicated\)/);
  assert.match(method, /A narrow fix stays a narrow plan/);
  assert.doesNotMatch(method, /The plan must include:\n\n- requirements trace to launch docs and `state\/LAUNCH_TRACE\.md` IDs\n- 11-star complete product experience/);
});

void test("normal planning entry delivers scoped app sources before authoring and retains implementation/review trace", () => {
  const skill = taskSkills.find((entry) => entry.name === "b2c-plan-implementation")!;
  const file = `${skillDirectory(skill)}/SKILL.md`;
  const projected = renderTaskSkillFiles(catalog)[file]!;
  const beforePlan = projected.indexOf("For work in an existing app repository, before planning");
  assert.ok(beforePlan >= 0 && beforePlan < projected.indexOf("Before `ce-work`"), "app sources must precede plan authoring in the delivered method");
  for (const route of ["architecture/decision owners", "affected flow/screen", "feature, journey, and customer acceptance", "source section → design/engineering choice → observable check", "Independent reviewers read the applicable app guides"]) {
    assert.ok(projected.includes(route), `missing delivered route: ${route}`);
  }
  assert.ok(projected.includes("Do not read every document"));
  assert.ok(projected.includes("Supplied-evidence advice without a repository uses the supplied constraints"));
  const workspaceEntry = readFileSync(path.join(root, "surfaces/workspace-template/repo-agent-entrypoints/AGENTS.md"), "utf8");
  assert.ok(workspaceEntry.includes("Before planning, read the applicable nested `AGENTS.md`"));
  assert.ok(workspaceEntry.includes("outside the session's starting directory"));
  assert.ok(workspaceEntry.includes("Reviewers independently open the applicable guides"));
});

void test("opportunity discovery routes to a bound subsection without adding universal growth startup", () => {
  const skill = taskSkills.find((entry) => entry.name === "b2c-research-opportunity")!;
  const file = `${skillDirectory(skill)}/SKILL.md`;
  const files = renderTaskSkillFiles(catalog);
  const projected = files[file]!;
  const route = projected.match(/For demand discovery or an authorized pilot, use \[discovery hypotheses\]\(([^)]+)\)/u);
  assert.ok(route, "the normal opportunity entry must deliver the conditional discovery route");
  const [relativePath, anchor] = route[1]!.split("#");
  const sourcePath = path.posix.normalize(path.posix.join(path.posix.dirname(file), relativePath!));
  const reference = referencesForTask(catalog, skill).find((entry) => entry.path === sourcePath);
  assert.ok(reference, "the discovery route must resolve to workflow-bound guidance");
  const source = readFileSync(path.join(root, sourcePath), "utf8");
  assert.ok(source.split(/\r?\n/u).some((line) => line === "### Discovery hypotheses" && anchor === "discovery-hypotheses"));
  const bundle = collectTaskSkillPackage(root, catalog, skill.name, revision);
  assert.ok(bundle.sourcePaths.includes(sourcePath), "standalone opportunity exports must carry the discovery owner");
  for (const other of taskSkills.filter((entry) => entry.name !== skill.name)) {
    assert.doesNotMatch(files[`${skillDirectory(other)}/SKILL.md`]!, /\[discovery hypotheses\]|Bounded cohort learning/u);
  }
  assert.doesNotMatch(readFileSync(path.join(root, "SKILL.md"), "utf8"), /Discovery hypotheses|Bounded cohort learning/u);
});

void test("missing workflow or required reference fails closed", () => {
  const skill = taskSkills[0]!;
  assert.throws(
    () => workflowsForTask({ ...catalog, workflows: catalog.workflows.filter((workflow) => workflow.id !== skill.workflowId) }, skill),
    /no canonical workflow/,
  );
  assert.throws(() => referencesForTask({ ...catalog, references: [] }, skill), /unresolved knowledge/);
});

void test("provider selection metadata cannot rewrite neutral task instructions", () => {
  const skill = taskSkills[2]!;
  const altered = {
    ...catalog,
    workflows: catalog.workflows.map((workflow) => (workflow.id === skill.workflowId ? { ...workflow, providerIds: ["provider.different-vendor"] } : workflow)),
  };
  const file = `${skillDirectory(skill)}/SKILL.md`;
  assert.equal(renderTaskSkillFiles(catalog)[file], renderTaskSkillFiles(altered)[file]);
});

void test("generated projections follow the selected stamp mode and root routing stays bounded", () => {
  const files = taskSkillProjections(root);
  assert.deepEqual(renderTaskSkills(root, true, driftIsLoose(resolveDriftMode(process.argv))), []);
  const entry = files["SKILL.md"]!;
  assert.ok(Buffer.byteLength(entry) < 6500);
  assert.match(entry, /Focused task/);
  assert.match(entry, /Managed business/);
  assert.match(entry, /Setup request/);
  assert.doesNotMatch(entry, /b2c composition-activate|--expected-revision|--mandate-file|B2C_APP_BUILDER_MCP_WRITE/u);
  for (const area of publicBusinessAreas) {
    assert.ok(files["README.md"]!.includes(`knowledge/README.md#${area.slug}`));
    assert.ok(readFileSync(path.join(root, "knowledge/README.md"), "utf8").includes(`## ${area.name}`));
  }
});

void test("the packed runtime contains the stamped task library", () => {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 60_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout) as Array<{ files?: Array<{ path?: string }> }>;
  const files = new Set((report[0]?.files ?? []).map((entry) => entry.path).filter((entry): entry is string => typeof entry === "string"));
  assert.ok(files.has("SKILL.md"));
  assert.ok(files.has("agents/skills/brigade/references/business-lifecycle.md"));
  // Ordinary PRs add authored descriptors before the release stamp writes their directories.
  // The committed generated index owns the library shipped by the current stamp.
  const index = readFileSync(path.join(root, "agents/skills/README.md"), "utf8");
  const block = index.split("<!-- catalog-generated:start task-skills -->")[1]?.split("<!-- catalog-generated:end task-skills -->")[0];
  assert.ok(block, "the stamped task index is missing");
  const names = [...block.matchAll(/\]\((b2c-[a-z0-9-]+)\/SKILL\.md\)/gu)].map((match) => match[1]!);
  assert.ok(names.length > 0, "the stamped task index is empty");
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    const prefix = `agents/skills/${name}/`;
    assert.ok(files.has(`${prefix}SKILL.md`), `${prefix}SKILL.md is missing from npm pack`);
    assert.ok(files.has(`${prefix}references/task.md`), `${prefix}references/task.md is missing from npm pack`);
    assert.ok(
      [...files].some((file) => file.startsWith(prefix)),
      `${prefix} has no packed files`,
    );
  }
  assert.ok(![...files].some((file) => /(?:^|\/)(?:b2c-maintainer|b2c-contributor)(?:\/|$)|(?:^|\/)\.env(?:\/|$)/u.test(file)));
});

void test("package parity distinguishes the stamped PR library from required release projections", () => {
  const temporary = mkScratch("b2c-task-package-parity-");
  try {
    for (const file of ["package.json", "package-lock.json", "skill-version.json", ".nvmrc", ".node-version"]) {
      cpSync(path.join(root, file), path.join(temporary, file));
    }
    mkdirSync(path.join(temporary, "entrypoints/cli"), { recursive: true });
    writeFileSync(path.join(temporary, "entrypoints/cli/b2c.mjs"), "// Fixture arms the local pack check.\n");
    const fakeNpm = path.join(temporary, "empty-pack.cjs");
    // Empty pack output isolates required-path selection; the real pack smoke runs above.
    writeFileSync(fakeNpm, 'process.stdout.write(JSON.stringify([{ files: [] }]));\n');
    const indexPath = path.join(temporary, "agents/skills/README.md");
    mkdirSync(path.dirname(indexPath), { recursive: true });
    const film = taskSkills.find((skill) => skill.method?.referenceId === "reference.design.pitch-film-studio")!;
    const stampedIndex = readFileSync(path.join(root, "agents/skills/README.md"), "utf8")
      .split(/\r?\n/u).filter((line) => !line.includes(`](${film.name}/SKILL.md)`)).join("\n");
    writeFileSync(indexPath, stampedIndex);
    const run = (mode: "pr" | "release") => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", path.join(root, "checks/validation/repository/check-package-parity.ts"), "--repo-root", temporary, "--skill-root", temporary, "--json"],
        { cwd: root, encoding: "utf8", timeout: 30_000, env: { ...process.env, B2C_STAMP_MODE: mode, npm_execpath: fakeNpm } },
      );
      assert.equal(result.status, 1, result.stderr);
      return (JSON.parse(result.stdout) as { failures: Array<{ rule: string; message: string }> }).failures;
    };
    const pr = run("pr");
    assert.ok(!pr.some((entry) => entry.rule === "package_parity.pack_missing_file" && entry.message.includes(`${skillDirectory(film)}/`)));
    assert.ok(pr.some((entry) => entry.rule === "package_parity.pack_missing_file" && entry.message.includes("agents/skills/b2c-research-opportunity/SKILL.md")), "missing stamped skills must still fail in PR mode");
    assert.ok(run("release").some((entry) => entry.rule === "package_parity.pack_missing_file" && entry.message.includes(`${skillDirectory(film)}/SKILL.md`)), "release mode must require the new descriptor's files");
    rmSync(indexPath);
    assert.ok(run("pr").some((entry) => entry.rule === "package_parity.task_skill_index_missing"));
    for (const malformed of ["no generated table", stampedIndex.replace("| Task | Use when |", "| Broken | Table |"), `${stampedIndex}\n<!-- catalog-generated:start task-skills -->`]) {
      writeFileSync(indexPath, malformed);
      assert.ok(run("pr").some((entry) => entry.rule === "package_parity.task_skill_index_invalid"), "a malformed index must not silently exempt task files");
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

void test("generated block replacement refuses ambiguous ownership", () => {
  assert.throws(() => replaceGeneratedBlock("no markers", "task-skills", "x"), /Missing/);
  const marked = "<!-- catalog-generated:start x -->old<!-- catalog-generated:end x -->";
  assert.match(replaceGeneratedBlock(marked, "x", "new"), /new/);
  assert.throws(() => replaceGeneratedBlock(marked + marked, "x", "new"), /duplicated/);
});

void test("source render and export do not require a stamped runtime catalog", () => {
  const temporary = mkScratch("b2c-unstamped-task-");
  const source = path.join(temporary, "source");
  try {
    mkdirSync(source);
    for (const file of ["package.json", "skill-version.json", "LICENSE", "THIRD_PARTY_NOTICES.md"]) {
      cpSync(path.join(root, file), path.join(source, file));
    }
    for (const directory of ["catalog/knowledge", "knowledge"]) {
      cpSync(path.join(root, directory), path.join(source, directory), { recursive: true });
    }
    const skill = taskSkills.find((entry) => entry.method?.referenceId === "reference.design.pitch-film-studio")!;
    const reference = catalog.references.find((entry) => entry.id === skill.method!.referenceId)!;
    const original = readFileSync(path.join(root, reference.path), "utf8");
    const marker = "Alternate-root fixture method must bind these source bytes.";
    const changed = original.replace(`## ${skill.method!.heading}\n`, `## ${skill.method!.heading}\n\n${marker}\n`);
    assert.notEqual(changed, original);
    writeFileSync(path.join(source, reference.path), changed);
    assert.ok(!existsSync(path.join(source, "catalog/generated")));
    assert.throws(() => composeCatalog(source), { code: "ENOENT" }, "runtime reads must still require the verified stamp");
    const projections = taskSkillProjections(source);
    for (const skill of taskSkills) assert.ok(projections[`${skillDirectory(skill)}/SKILL.md`]);
    assert.ok(projections[`${skillDirectory(skill)}/SKILL.md`]!.includes(marker), "method rendering must read the selected root instead of cwd");
    assert.deepEqual(renderTaskSkills(source, true, true), [], "PR mode permits missing generated projections");
    assert.ok(renderTaskSkills(source, true).some((error) => error.startsWith("Task skill projection drift:")), "release mode requires generated projections");

    const childTest = path.join(source, "checks/verification/task-skills.test.ts");
    mkdirSync(path.dirname(childTest), { recursive: true });
    writeFileSync(childTest, 'import assert from "node:assert/strict"; assert.equal(process.env.B2C_STAMP_MODE, "pr");\n');
    const runChecker = (mode: "pr" | "release" | undefined, inheritedMode: "" | undefined) => {
      const result = spawnSync(
        process.execPath,
        ["--import", "tsx", path.join(root, "checks/validation/repository/check-task-skills.ts"), "--root", source, ...(mode ? ["--stamp-mode", mode] : []), "--json"],
        { cwd: root, encoding: "utf8", timeout: 30_000, env: { ...process.env, B2C_STAMP_MODE: inheritedMode } },
      );
      return { status: result.status, report: JSON.parse(result.stdout), stderr: result.stderr };
    };
    for (const inheritedMode of [undefined, ""] as const) {
      const pr = runChecker("pr", inheritedMode);
      assert.equal(pr.status, 0, pr.stderr);
      assert.equal(pr.report.pass, true, "an explicit PR flag must reach child tests without relying on inherited env");
    }
    for (const mode of ["release", undefined] as const) {
      const strict = runChecker(mode, undefined);
      assert.equal(strict.status, 1);
      assert.ok(strict.report.failures.some((entry: { rule: string }) => entry.rule === "task_skills.projection_drift"), "release/default mode must retain strict stamp checks");
    }

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", path.join(root, "tooling/export-task-skill.ts"), "--root", source, "--skill", skill.name, "--output", path.join(temporary, "export"), "--source-revision", revision],
      { cwd: root, encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.installed, false);
    assert.equal(report.executionIncluded, false);
    const manifest = JSON.parse(readFileSync(path.join(report.directory, "source-manifest.json"), "utf8"));
    assert.equal(manifest.sourceRevision, revision);
    const methodSource = manifest.sources.find((entry: { referenceId: string }) => entry.referenceId === skill.method!.referenceId);
    assert.equal(methodSource?.sha256, hash(changed));
    assert.ok(readFileSync(path.join(report.directory, "SKILL.md"), "utf8").includes(marker), "exported method and manifest must bind the same root");
    assert.equal(readFileSync(path.join(report.directory, "references/source", reference.path), "utf8"), changed);
    assert.equal(readFileSync(path.join(root, reference.path), "utf8"), original);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

void test("the film task exports its method and shared production and script guidance", () => {
  const skill = taskSkills.find((entry) => entry.method?.referenceId === "reference.design.pitch-film-studio");
  assert.ok(skill, "the film task must bind its authored method");
  assert.equal(skill.workflowId, "workflow.design.content-assets-remotion-generated-visuals");
  assert.equal(skill.groupId, undefined, "conditional film stages must not create another managed workflow group");
  const bundle = collectTaskSkillPackage(root, catalog, skill.name, revision);
  for (const anchor of ["strategic-brief", "three-concepts", "causal-script", "production-handoff", "evidence-and-quality-review"]) {
    assert.ok(bundle.files["SKILL.md"]!.includes(`](references/source/knowledge/design/pitch-film-studio.md#${anchor})`), `film stage does not link to its bundled source: ${anchor}`);
  }
  for (const referenceId of ["reference.design.pitch-film-studio", "reference.design.remotion-content-assets", "reference.growth.ugc-creator-engine"]) {
    const reference = catalog.references.find((entry) => entry.id === referenceId);
    assert.ok(reference, `missing film reference: ${referenceId}`);
    assert.ok(bundle.sourcePaths.includes(reference.path), `film export omits ${referenceId}`);
    assert.ok(bundle.files[`references/source/${reference.path}`], `film reference is not relocated: ${referenceId}`);
  }
  assert.ok(!bundle.supplementalLinks.some((url) => /\/knowledge\/(?:design\/(?:pitch-film-studio|remotion-content-assets)|growth\/ugc-creator-engine)\.md(?:[#?]|$)/u.test(url)));
});

for (const skill of taskSkills) {
  void test(`${skill.name} exports relocatable bound guidance and complete notices`, () => {
    const temporary = mkScratch("b2c-task-skill-");
    try {
      const bundle = collectTaskSkillPackage(root, catalog, skill.name, revision);
      const target = writeTaskSkillPackage(temporary, skill.name, bundle);
      const manifest = JSON.parse(bundle.files["source-manifest.json"]!);
      assert.equal(manifest.executionIncluded, false);
      assert.equal(bundle.files["THIRD_PARTY_NOTICES.md"], readFileSync(path.join(root, "THIRD_PARTY_NOTICES.md"), "utf8"));
      for (const resource of manifest.resources) assert.equal(hash(bundle.files[resource.path]!), resource.sha256);
      for (const reference of referencesForTask(catalog, skill)) assert.ok(bundle.sourcePaths.includes(reference.path));
      for (const [file, content] of Object.entries(bundle.files)) {
        if (!file.endsWith(".md") || file === "THIRD_PARTY_NOTICES.md") continue;
        for (const match of content.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)[^)\n]*\)/gu)) {
          const url = match[1]!;
          if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/iu.test(url)) continue;
          const destination = path.resolve(target, path.dirname(file), decodeURIComponent(url.split(/[?#]/u)[0]!));
          assert.ok(destination.startsWith(`${target}${path.sep}`), `${file}: ${url} escapes`);
          assert.ok(existsSync(destination), `${file}: ${url} is missing`);
        }
      }
      assert.throws(() => writeTaskSkillPackage(temporary, skill.name, bundle), /already exists/);
      assert.ok(!Object.keys(bundle.files).some((file) => /b2c-maintainer|b2c-contributor|\.env$/u.test(file)));
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });
}

void test("export refuses unknown skills, escaping resources, and symlinked destinations", () => {
  assert.throws(() => collectTaskSkillPackage(root, catalog, "../escape", revision), /Unknown task/);
  assert.throws(() => collectTaskSkillPackage(root, catalog, taskSkills[0]!.name, "main"), /full source commit/);
  const temporary = mkScratch("b2c-export-safety-");
  try {
    const name = taskSkills[0]!.name;
    const sentinel = path.join(temporary, "sentinel");
    writeFileSync(sentinel, "unchanged");
    assert.throws(() => writeTaskSkillPackage(temporary, name, { files: { "../sentinel": "bad" }, sourcePaths: [], supplementalLinks: [] }), /escapes/);
    assert.equal(readFileSync(sentinel, "utf8"), "unchanged");
    symlinkSync(temporary, path.join(temporary, "alias"));
    assert.throws(() => writeTaskSkillPackage(path.join(temporary, "alias"), name, { files: {}, sourcePaths: [], supplementalLinks: [] }), /symlinks/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

void test("moving procedures preserves authority and fails on missing, unlinked, or oversized guidance", () => {
  const temporary = mkScratch("b2c-routing-contract-");
  const procedure = "agents/skills/brigade/references/business-lifecycle.md";
  const fixture = "checks/validation/repository/evals/triggering/autopilot-triggering.yaml";
  const original = readFileSync(path.join(root, "SKILL.md"), "utf8");
  const run = () =>
    spawnSync(process.execPath, ["--import", "tsx", path.join(root, "checks/validation/repository/check-autopilot-contract.ts"), "--skill-root", temporary], {
      cwd: root,
      encoding: "utf8",
      timeout: 30_000,
    });
  try {
    mkdirSync(path.dirname(path.join(temporary, fixture)), { recursive: true });
    cpSync(path.join(root, fixture), path.join(temporary, fixture));
    cpSync(path.join(root, "agents/skills/brigade/references"), path.join(temporary, "agents/skills/brigade/references"), { recursive: true });
    writeFileSync(path.join(temporary, "SKILL.md"), original);
    assert.equal(run().status, 0, "the complete linked contract must pass");
    const content = readFileSync(path.join(temporary, procedure), "utf8");
    rmSync(path.join(temporary, procedure));
    let result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /autopilot.reference.missing/);
    writeFileSync(path.join(temporary, procedure), content.replace("It does not delegate protected actions.", ""));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /autopilot.reference.required_term_missing/);
    writeFileSync(path.join(temporary, procedure), content);
    writeFileSync(path.join(temporary, "SKILL.md"), original.replace(`](${procedure})`, "](missing.md)"));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /autopilot.reference.unlinked/);
    writeFileSync(path.join(temporary, "SKILL.md"), original + "x".repeat(6500));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /autopilot.body.context_budget/);
    writeFileSync(path.join(temporary, "SKILL.md"), original);
    rmSync(path.join(temporary, procedure));
    symlinkSync(path.join(root, procedure), path.join(temporary, procedure));
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stdout, /autopilot.reference.missing/);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

void test("task-skill checker returns canonical JSON for invalid sources without crashing", () => {
  const temporary = mkScratch("b2c-task-json-");
  try {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", path.join(root, "checks/validation/repository/check-task-skills.ts"), "--root", temporary, "--json"],
      { cwd: root, encoding: "utf8", timeout: 30_000 },
    );
    assert.equal(result.status, 1);
    const report = JSON.parse(result.stdout);
    assert.equal(report.pass, false);
    assert.ok(report.failures.length > 0);
    assert.ok(
      report.failures.every(
        (entry: { rule: string; severity: string; message: string }) =>
          typeof entry.rule === "string" && entry.severity === "error" && typeof entry.message === "string",
      ),
    );
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
