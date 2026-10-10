import { chmodSync, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { assert, skillRoot, type Harness } from "./_harness.js";
import { createPlanningWorkspace } from "../../../kernel/session/new.js";
import {
  ENTRYPOINT_TEMPLATE_RELATIVE,
  WORKSPACE_ENTRYPOINT_FILES,
  applyTemplateVars,
  inspectWorkspaceEntrypoints,
  refreshWorkspaceEntrypoints,
} from "../../../adapters/workspace-entrypoints.js";

const source = (file: string): string => readFileSync(path.join(skillRoot, ENTRYPOINT_TEMPLATE_RELATIVE, file), "utf8");
const snapshot = (root: string, relative = ""): string =>
  JSON.stringify(
    readdirSync(path.join(root, relative))
      .sort()
      .map((name) => {
        const file = path.join(relative, name),
          stat = lstatSync(path.join(root, file));
        return stat.isDirectory()
          ? [file, snapshot(root, file)]
          : [
              file,
              stat.mode,
              stat.isSymbolicLink()
                ? "link"
                : createHash("sha256")
                    .update(readFileSync(path.join(root, file)))
                    .digest("hex"),
            ];
      }),
  );
function write(root: string, file: string, text: string): void {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
}

export function register(harness: Harness): void {
  harness.check("workspace-entrypoints: planning creation installs the same owned guidance without runtime setup", () => {
    const parent = harness.makeTempDir("startup-planning"),
      target = path.join(parent, "quiet-garden");
    createPlanningWorkspace({ directory: target, slug: "quiet-garden", name: "Quiet Garden" });
    assert(inspectWorkspaceEntrypoints({ target }).status === "current", "creation must use the common current ownership format");
    assert(readFileSync(path.join(target, "AGENTS.md"), "utf8").includes("Quiet Garden"), "creation must retain app identity");
    for (const file of ["catalog.json", ".b2c-launch/runtime.json", ".claude/settings.json", "APP_AGENTS.md"])
      assert(!existsSync(path.join(target, file)), `planning must not create ${file}`);
    assert(readFileSync(path.join(target, ".cursor/rules/agents.mdc"), "utf8").startsWith("---\n"), "Cursor must retain leading YAML frontmatter");
  });
  harness.check("workspace-entrypoints: preview and inspection are pure, apply fills missing files, repeat is byte stable", () => {
    const target = harness.makeTempDir("startup-missing"),
      before = snapshot(target);
    assert(inspectWorkspaceEntrypoints({ target }).status === "missing", "missing guides must be observable");
    const preview = refreshWorkspaceEntrypoints({ target, apply: false, vars: { APP_NAME: "Forest" } });
    assert(preview.changed && !preview.applied && snapshot(target) === before, "preview must write nothing");
    const applied = refreshWorkspaceEntrypoints({ target, apply: true, vars: { APP_NAME: "Forest" } });
    assert(applied.status === "current" && applied.changed && applied.applied, "apply must repair missing guides");
    const installed = snapshot(target),
      repeat = refreshWorkspaceEntrypoints({ target, apply: true });
    assert(repeat.status === "current" && !repeat.changed && snapshot(target) === installed, "repeat without vars must preserve identity and bytes");
  });
  harness.check("workspace-entrypoints: exact unmarked templates preserve custom prefix and suffix in active files", () => {
    const target = harness.makeTempDir("startup-legacy"),
      prefix = "# App conventions\r\n\r\nKeep offline edits.\r\n",
      suffix = "\r\nPreserve intent at handoff.\r\n";
    for (const file of WORKSPACE_ENTRYPOINT_FILES)
      write(target, file, prefix + applyTemplateVars(source(file), { APP_NAME: "Forest" }).replaceAll("\n", "\r\n") + suffix);
    const result = refreshWorkspaceEntrypoints({ target, apply: true });
    assert(result.status === "current", "exact unmarked source must migrate");
    for (const file of WORKSPACE_ENTRYPOINT_FILES) {
      const text = readFileSync(path.join(target, file), "utf8");
      assert(text.includes(prefix) && text.endsWith(suffix), `custom bytes must remain active in ${file}`);
      assert((text.match(/brigade:workspace-entrypoint v1/g) ?? []).length === 1, "one owned block must replace the recognized source");
    }
    assert(readFileSync(path.join(target, "AGENTS.md"), "utf8").includes("Forest"), "migration must retain the original substituted name");
    assert(
      readFileSync(path.join(target, ".cursor/rules/agents.mdc"), "utf8").startsWith("---\r\n"),
      "Cursor migration must move existing frontmatter before app prefix",
    );
  });
  harness.check("workspace-entrypoints: migration normalizes name slots without rewriting matching prose", () => {
    const target = harness.makeTempDir("startup-name-collision");
    for (const file of WORKSPACE_ENTRYPOINT_FILES) write(target, file, applyTemplateVars(source(file), { APP_NAME: "Brigade" }));
    const preview = refreshWorkspaceEntrypoints({ target, apply: false });
    assert(
      preview.files.every((file) => file.reason === "legacy"),
      "a name that also occurs in normal prose must still match exactly",
    );
    assert(refreshWorkspaceEntrypoints({ target, apply: true }).status === "current", "matching name must migrate");
  });
  harness.check("workspace-entrypoints: app-authored guides survive addition and later source refresh byte for byte", () => {
    const target = harness.makeTempDir("startup-custom"),
      isolated = harness.makeTempDir("startup-source");
    for (const file of WORKSPACE_ENTRYPOINT_FILES) {
      const destination = path.join(isolated, ENTRYPOINT_TEMPLATE_RELATIVE, file);
      mkdirSync(path.dirname(destination), { recursive: true });
      copyFileSync(path.join(skillRoot, ENTRYPOINT_TEMPLATE_RELATIVE, file), destination);
    }
    const authored = "# App instructions\r\nUse local persistence.\r\n";
    write(target, "AGENTS.md", authored);
    chmodSync(path.join(target, "AGENTS.md"), 0o640);
    write(target, "CLAUDE.md", "Use the project test runner.");
    const cursor = "---\ndescription: App-owned description\nalwaysApply: true\ncustomMetadata: preserved\n---\n\nFollow app-specific naming.\n";
    write(target, ".cursor/rules/agents.mdc", cursor);
    refreshWorkspaceEntrypoints({ target, skillRoot: isolated, apply: true, vars: { APP_NAME: "Forest" } });
    const installed = readFileSync(path.join(target, "AGENTS.md"), "utf8"),
      suffix = "\n# Additional app rules\nPreserve import order.\n";
    write(target, "AGENTS.md", installed + suffix);
    write(isolated, path.join(ENTRYPOINT_TEMPLATE_RELATIVE, "AGENTS.md"), source("AGENTS.md") + "\nUse current scoped guidance.\n");
    assert(inspectWorkspaceEntrypoints({ target, skillRoot: isolated }).status === "stale", "changed source must make intact owned blocks stale");
    assert(refreshWorkspaceEntrypoints({ target, skillRoot: isolated, apply: true }).status === "current", "stale block must refresh");
    const current = readFileSync(path.join(target, "AGENTS.md"), "utf8");
    assert(
      current.startsWith(authored) && current.endsWith(suffix) && current.includes("Forest") && current.includes("Use current scoped guidance."),
      "refresh must update source while preserving active app prefix/suffix/name",
    );
    assert((lstatSync(path.join(target, "AGENTS.md")).mode & 0o777) === 0o640, "refresh must preserve existing guide permissions");
    assert(readFileSync(path.join(target, ".cursor/rules/agents.mdc"), "utf8").startsWith(cursor), "custom Cursor metadata and rules must survive unchanged");
  });
  for (const [label, modify] of [
    ["modified owned guidance", (text: string) => text.replace("consumer app", "desktop app")],
    ["missing end marker", (text: string) => text.replace("<!-- /brigade:workspace-entrypoint -->", "")],
    ["duplicate owned block", (text: string) => text + text],
    ["malformed ownership metadata", (text: string) => text.replace(/v1 [A-Za-z0-9_-]+/, "v1 invalid")],
  ] as const)
    harness.check(`workspace-entrypoints: ${label} refuses every write`, () => {
      const target = harness.makeTempDir(`startup-${label.replaceAll(" ", "-")}`);
      refreshWorkspaceEntrypoints({ target, apply: true });
      write(target, "AGENTS.md", modify(readFileSync(path.join(target, "AGENTS.md"), "utf8")));
      const before = snapshot(target),
        result = refreshWorkspaceEntrypoints({ target, apply: true, vars: { APP_NAME: "Changed Name" } });
      assert(result.status === "modified" && !result.applied && snapshot(target) === before, "one ownership conflict must prevent all writes");
      assert(!JSON.stringify(result).includes(target), "report must not expose workspace paths");
    });
  harness.check("workspace-entrypoints: edited unmarked legacy guidance refuses instead of appending conflicting instructions", () => {
    const target = harness.makeTempDir("startup-edited-legacy");
    write(target, "AGENTS.md", source("AGENTS.md").replace("consumer app", "desktop app"));
    const before = snapshot(target),
      result = refreshWorkspaceEntrypoints({ target, apply: true });
    assert(result.status === "modified" && snapshot(target) === before, "recognizable edited legacy instructions require reconciliation");
  });
  for (const kind of ["file", "dangling-file", "ancestor", "dangling-ancestor", "directory-in-place", "oversized"] as const)
    harness.check(`workspace-entrypoints: unsafe ${kind} preflights before missing guides are written`, () => {
      const target = harness.makeTempDir(`startup-unsafe-${kind}`),
        outside = harness.makeTempDir(`startup-outside-${kind}`);
      write(outside, "external", "untouched");
      if (kind === "file" || kind === "dangling-file") symlinkSync(path.join(outside, kind === "file" ? "external" : "absent"), path.join(target, "CLAUDE.md"));
      else if (kind === "ancestor" || kind === "dangling-ancestor")
        symlinkSync(kind === "ancestor" ? outside : path.join(outside, "absent"), path.join(target, ".cursor"));
      else if (kind === "directory-in-place") mkdirSync(path.join(target, "CLAUDE.md"));
      else write(target, "CLAUDE.md", "x".repeat(128 * 1024 + 1));
      const before = snapshot(target),
        result = refreshWorkspaceEntrypoints({ target, apply: true });
      assert(result.status === "unsafe" && !result.applied && snapshot(target) === before, "unsafe path must prevent every write");
      assert(readFileSync(path.join(outside, "external"), "utf8") === "untouched", "outside target must remain untouched");
    });
  harness.check("workspace-entrypoints: target symlink is refused", () => {
    const parent = harness.makeTempDir("startup-linked-target"),
      outside = harness.makeTempDir("startup-linked-destination"),
      target = path.join(parent, "workspace");
    symlinkSync(outside, target);
    assert(
      refreshWorkspaceEntrypoints({ target, apply: true }).status === "unsafe" && readdirSync(outside).length === 0,
      "workspace symlink must not be followed",
    );
  });
  harness.check("workspace-entrypoints: workspace ancestor symlink is refused", () => {
    const parent = harness.makeTempDir("startup-linked-ancestor"),
      outside = harness.makeTempDir("startup-linked-ancestor-destination");
    mkdirSync(path.join(outside, "workspace"));
    symlinkSync(outside, path.join(parent, "alias"));
    const result = refreshWorkspaceEntrypoints({ target: path.join(parent, "alias", "workspace"), apply: true });
    assert(result.status === "unsafe" && readdirSync(path.join(outside, "workspace")).length === 0, "workspace ancestors must not redirect writes");
  });
  for (const header of ["---\nalwaysApply: false\n---\n", "---\nglobs: '*.ts'\n---\n", "---\nalwaysApply: true\n"])
    harness.check(`workspace-entrypoints: conflicting Cursor scope ${JSON.stringify(header)} refuses every write`, () => {
      const target = harness.makeTempDir(`startup-cursor-${createHash("sha256").update(header).digest("hex").slice(0, 6)}`);
      write(target, ".cursor/rules/agents.mdc", header + "Preserve local rules.");
      const before = snapshot(target);
      assert(
        refreshWorkspaceEntrypoints({ target, apply: true }).status === "modified" && snapshot(target) === before,
        "conflicting or malformed frontmatter needs explicit reconciliation",
      );
    });
  harness.check("workspace-entrypoints: guidance refresh never touches catalog, pins, reducer state, permissions, roles, product, or design", () => {
    const target = harness.makeTempDir("startup-scope");
    const protectedFiles = [
      "catalog.json",
      ".b2c-launch/runtime.json",
      ".b2c-launch/state.json",
      ".claude/settings.json",
      "APP_AGENTS.md",
      "agents/mobile-engineer.md",
      "product.yaml",
      "PRODUCT.md",
      "DESIGN.md",
    ];
    for (const file of protectedFiles) {
      write(target, file, `app-owned:${file}\n`);
      chmodSync(path.join(target, file), 0o640);
    }
    refreshWorkspaceEntrypoints({ target, apply: true });
    for (const file of protectedFiles) {
      assert(readFileSync(path.join(target, file), "utf8") === `app-owned:${file}\n`, `${file} bytes must be unchanged`);
      assert((lstatSync(path.join(target, file)).mode & 0o777) === 0o640, `${file} permissions must be unchanged`);
    }
  });
}
