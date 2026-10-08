import { skillDirectory, taskSkills } from "../../catalog/task-skills.js";

/**
 * Stamp-managed paths. `npm run release:stamp` is the writer.
 * Ordinary pull requests must not change these paths.
 * The same list is documented in checks/validation/repository/skill-versioning.md.
 */

export const STAMP_EXACT_PATHS = [
  "skill-version.json",
  "kernel/schema/evidence-schema-version.json",
  "knowledge/README.md",
  "ACKNOWLEDGMENTS.md",
  "THIRD_PARTY_NOTICES.md",
  "docs/upstreams/coverage-report.md",
  "docs/upstreams/support-report.md",
  "examples/spec-pack/index.html",
  "contracts/public-api/REFERENCE.md",
  "contracts/extensions/schemas/extension.schema.json",
] as const;

export const STAMP_TREE_PREFIXES = ["catalog/generated/", "contracts/public-api/schemas/"] as const;

/** Only the `version` field of these files is stamp-managed. Dependency edits may land in a pull request. */
export const STAMP_VERSION_FIELD_PATHS = ["package.json", "package-lock.json"] as const;

/** Renderers splice these files. Prose outside the generated blocks is not a stamp edit. */
export const STAMP_GENERATED_BLOCK_PATHS = ["README.md", "SKILL.md", "agents/skills/README.md"] as const;

const BLOCK = /<!-- catalog-generated:start [\w-]+ -->[\s\S]*?<!-- catalog-generated:end [\w-]+ -->/gu;

export function generatedTaskSkillPrefixes(): string[] {
  return taskSkills.map((skill) => `${skillDirectory(skill)}/`);
}

export function isStampPath(relative: string): boolean {
  const normalized = relative.replaceAll("\\", "/");
  if ((STAMP_EXACT_PATHS as readonly string[]).includes(normalized)) return true;
  if (STAMP_TREE_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;
  if (generatedTaskSkillPrefixes().some((prefix) => normalized.startsWith(prefix))) return true;
  return false;
}

/** Why a changed path is a stamp edit, or undefined when the pull request may carry it. */
export function stampChangeReason(relative: string, before: string | undefined, after: string | undefined): string | undefined {
  const normalized = relative.replaceAll("\\", "/");
  if ((STAMP_VERSION_FIELD_PATHS as readonly string[]).includes(normalized)) {
    return versionFieldChanged(before, after) ? `${normalized} version` : undefined;
  }
  if ((STAMP_GENERATED_BLOCK_PATHS as readonly string[]).includes(normalized)) {
    return blocks(before) === blocks(after) ? undefined : `${normalized} generated block`;
  }
  if (isStampPath(normalized)) return normalized;
  return undefined;
}

function blocks(text: string | undefined): string {
  return (text ?? "").match(BLOCK)?.join("\n") ?? "";
}

function versionFieldChanged(before: string | undefined, after: string | undefined): boolean {
  return rootVersions(before).join("\n") !== rootVersions(after).join("\n");
}

/** Root `version`, plus the lockfile's `packages[""].version` when present. */
function rootVersions(text: string | undefined): string[] {
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const record = parsed as { version?: unknown; packages?: unknown };
    const versions: string[] = [];
    if (typeof record.version === "string") versions.push(record.version);
    const packages = record.packages;
    if (packages && typeof packages === "object" && !Array.isArray(packages)) {
      const root = (packages as { [""]?: { version?: unknown } })[""];
      if (root && typeof root.version === "string") versions.push(root.version);
    }
    return versions;
  } catch {
    return [text];
  }
}
