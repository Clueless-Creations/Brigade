/** Bounded startup guidance. The managed block is a projection, never workspace state. */
import { createHash } from "node:crypto";
import { chmodSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { atomicFile } from "../kernel/lib/atomic-file.js";
import { boundedFileBytes } from "../kernel/lib/bounded-file.js";
import { resolveSkillRoot } from "../tooling/lib/skill-root.js";

export const ENTRYPOINT_TEMPLATE_RELATIVE = "surfaces/workspace-template/repo-agent-entrypoints";
export const WORKSPACE_ENTRYPOINT_FILES = ["AGENTS.md", "CLAUDE.md", ".cursor/rules/agents.mdc"] as const;
export type WorkspaceEntrypointFile = (typeof WORKSPACE_ENTRYPOINT_FILES)[number];
export type WorkspaceEntrypointStatus = "current" | "missing" | "stale" | "modified" | "unsafe";
export interface WorkspaceEntrypointReport {
  readonly status: WorkspaceEntrypointStatus;
  readonly files: readonly { file: WorkspaceEntrypointFile; status: WorkspaceEntrypointStatus; reason: string }[];
  readonly changed: boolean;
  readonly applied: boolean;
}
interface Input {
  target: string;
  skillRoot?: string;
  vars?: Readonly<Record<string, string>>;
}
interface Metadata {
  source: string;
  content: string;
  vars: Record<string, string>;
}
interface PlannedFile {
  file: WorkspaceEntrypointFile;
  status: WorkspaceEntrypointStatus;
  reason: string;
  before?: string;
  next?: string;
}
const LIMIT = 128 * 1024;
const BEGIN = "<!-- brigade:workspace-entrypoint v1 ";
const END = "<!-- /brigade:workspace-entrypoint -->";
const MARKER = /<!--\s*\/?brigade:workspace-entrypoint/;
const hash = (text: string): string => createHash("sha256").update(text).digest("hex");

// Frozen migration identities for the unmarked templates shipped in 0.221.131.
// Keep hashes, not a second live copy of policy. APP_NAME and CRLF are normalized.
const LEGACY: Record<WorkspaceEntrypointFile, { lines: number; sha256: string; anchors: string[] }> = {
  "AGENTS.md": {
    lines: 119,
    sha256: "60a30562d7277a9c1f9c58ab7978fc9451fc6951158a2b8c68dae804f4fe6342",
    anchors: [
      "c7cd6e1cb4b54b696a3a6a20c1e7fa166cb1781422a67d6695c3c6407ad02436",
      "a88ce70bf4a772cce75bd7642767e32e74df6e80a60d020cd2ba96dfd668b56e",
      "e2267984bd1778ce39eed8ada0b37d7d47c5bc64e7ce4845177b3ee611f96c4f",
      "81fa012d933619512fcf57449c0477fa4680541f74d04351adcfde5d7be63383",
    ],
  },
  "CLAUDE.md": {
    lines: 14,
    sha256: "b8e0bc7da3df3acb2ce447ceed919fbdbb4e0a7583880594b2cf3a2592489c92",
    anchors: [
      "c8788023ce9bb2ed3fb96daa1c958773bf20e189a19366221027ed55c3032137",
      "6d4600a441bf70c50d520b4bd7de43c6794f8e1073849aa1dcde0bc6ce24548e",
      "af5c59917e015174cab05eb8153ecded622146e03980b2605a28bddb4c4da7f4",
      "ccb2f2a58a47692623b811dc032d9a26e8aa6b9c9779540f80cbe16ace8d8da2",
    ],
  },
  ".cursor/rules/agents.mdc": {
    lines: 12,
    sha256: "2abe65f3196ae2ab1f9fac34521cd9b9447c6c632d3c3a1c5b2084bd18e3732b",
    anchors: [
      "3b13cb03b0558d320deb1c82ea843798e040ab067b7e6db160c47f8912d38ab5",
      "146dcd358d14a87c94a318ba0eeb825896d823df3eef1ef46e18e0ce9f89e2af",
      "b61651d6522528e2f09a03875f9ff69909fd5ee1a81ec0fd104ae8ab351015aa",
      "13cf33b68b91070d9ae6c3798c581ab646bd4b4c0644bb48e5db0be3ec6db321",
    ],
  },
};

export function applyTemplateVars(content: string, vars: Readonly<Record<string, string>>): string {
  return content.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => (Object.prototype.hasOwnProperty.call(vars, key) ? vars[key]! : match));
}
function validVars(vars: unknown): vars is Record<string, string> {
  return (
    vars !== null &&
    typeof vars === "object" &&
    !Array.isArray(vars) &&
    Object.entries(vars).length <= 32 &&
    Object.entries(vars).every(
      ([key, value]) => /^[A-Z0-9_]+$/.test(key) && typeof value === "string" && value.length <= 512 && !/[\r\n\0]/.test(value) && !MARKER.test(value),
    )
  );
}
function statIfPresent(file: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
function workspaceRoot(target: string): string {
  let current = path.parse(target).root;
  for (const segment of target.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = lstatSync(current);
    // macOS exposes these system directories as immutable-layout aliases. Do not
    // mistake them for a workspace-controlled link, including in temporary tests.
    const systemAlias =
      process.platform === "darwin" &&
      ((current === "/tmp" && realpathSync(current) === "/private/tmp") || (current === "/var" && realpathSync(current) === "/private/var"));
    if ((!stat.isDirectory() && !systemAlias) || (stat.isSymbolicLink() && !systemAlias)) throw new Error("path_unsafe");
  }
  if (lstatSync(target).isSymbolicLink()) throw new Error("path_unsafe");
  return realpathSync(target);
}
function readTarget(root: string, file: WorkspaceEntrypointFile): string | undefined {
  const segments = file.split("/");
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const stat = statIfPresent(current);
    if (!stat) return undefined;
    if (stat.isSymbolicLink() || (index < segments.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new Error("path_unsafe");
    if (index === segments.length - 1 && stat.size > LIMIT) throw new Error("file_too_large");
  }
  const bytes = boundedFileBytes(current, LIMIT);
  const text = bytes.toString("utf8");
  if (!Buffer.from(text).equals(bytes) || text.includes("\0")) throw new Error("file_encoding");
  return text;
}
function frontmatter(text: string): { prefix: string; body: string } | undefined {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return undefined;
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) throw new Error("cursor_scope_conflict");
  const parsed = parseYaml(match[1]!);
  if (!parsed || typeof parsed !== "object" || parsed.alwaysApply !== true) throw new Error("cursor_scope_conflict");
  return { prefix: match[0], body: text.slice(match[0].length) };
}
function renderBlock(source: string, vars: Record<string, string>, cursor: boolean): string {
  if (!validVars(vars)) throw new Error("vars_invalid");
  const body = applyTemplateVars(cursor ? frontmatter(source)!.body : source, vars);
  const metadata: Metadata = { source: hash(source), content: hash(body), vars };
  return `${BEGIN}${Buffer.from(JSON.stringify(metadata)).toString("base64url")} -->\n${body}${END}\n`;
}
function normalizedLegacy(text: string, file: WorkspaceEntrypointFile): { text: string; vars: Record<string, string> } {
  let normalized = text.replace(/\r\n/g, "\n");
  let name: string | undefined;
  if (file === "AGENTS.md") {
    name = /^# (.+) Agent Guide\n/.exec(normalized)?.[1];
    if (name)
      normalized = normalized
        .replace(`# ${name} Agent Guide\n`, "# {{APP_NAME}} Agent Guide\n")
        .replace(`This repository is the operating home for ${name},`, "This repository is the operating home for {{APP_NAME}},");
  } else if (file === "CLAUDE.md") {
    name = /canonical operating guide for (.+?)(?:\. Follow its current-work routing|\.\n)/.exec(normalized)?.[1];
    if (name) normalized = normalized.replace(`canonical operating guide for ${name}.`, "canonical operating guide for {{APP_NAME}}.");
  }
  return { text: normalized, vars: name ? { APP_NAME: name } : {} };
}
function legacyMatch(text: string, source: string, file: WorkspaceEntrypointFile): { start: number; end: number; vars: Record<string, string> } | undefined {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const current = { lines: (source.match(/\n/g) ?? []).length + (source.endsWith("\n") ? 0 : 1), sha256: hash(source.replace(/\r\n/g, "\n")) };
  const matches = new Map<string, { start: number; end: number; vars: Record<string, string> }>();
  let offset = 0;
  for (let index = 0; index < lines.length; index++) {
    for (const fingerprint of [LEGACY[file], current]) {
      const candidate = lines.slice(index, index + fingerprint.lines).join("");
      const normalized = normalizedLegacy(candidate, file);
      if (hash(normalized.text) === fingerprint.sha256)
        matches.set(`${offset}:${offset + candidate.length}`, { start: offset, end: offset + candidate.length, vars: normalized.vars });
    }
    offset += lines[index]!.length;
  }
  if (matches.size > 1) throw new Error("legacy_ambiguous");
  if (matches.size === 1) return [...matches.values()][0];
  const lineHashes = new Set(lines.map((line) => hash(line.replace(/\r?\n$/, ""))));
  if (LEGACY[file].anchors.filter((anchor) => lineHashes.has(anchor)).length >= 2) throw new Error("legacy_ambiguous");
  return undefined;
}
function planFile(file: WorkspaceEntrypointFile, before: string | undefined, source: string, supplied: Record<string, string>): PlannedFile {
  const cursor = file === ".cursor/rules/agents.mdc";
  const wrap = (vars: Record<string, string>): string => renderBlock(source, vars, cursor);
  if (before === undefined) return { file, status: "missing", reason: "missing", next: `${cursor ? frontmatter(source)!.prefix : ""}${wrap(supplied)}` };
  const fail = (reason: string): PlannedFile => ({ file, status: "modified", reason, before });
  if (MARKER.test(before)) {
    const expression = /<!-- brigade:workspace-entrypoint v1 ([A-Za-z0-9_-]+) -->\n([\s\S]*?)<!-- \/brigade:workspace-entrypoint -->\n/g;
    const matches = [...before.matchAll(expression)];
    if (matches.length !== 1) return fail("markers_invalid");
    const match = matches[0]!,
      start = match.index!;
    const outside = before.slice(0, start) + before.slice(start + match[0].length);
    if (MARKER.test(outside)) return fail("markers_invalid");
    let metadata: Metadata;
    try {
      metadata = JSON.parse(Buffer.from(match[1]!, "base64url").toString("utf8")) as Metadata;
    } catch {
      return fail("markers_invalid");
    }
    if (!metadata || !/^[a-f0-9]{64}$/.test(metadata.source) || !/^[a-f0-9]{64}$/.test(metadata.content) || !validVars(metadata.vars))
      return fail("markers_invalid");
    if (metadata.content !== hash(match[2]!)) return fail("managed_content_changed");
    if (cursor && !frontmatter(before)) return fail("cursor_scope_conflict");
    const vars = { ...metadata.vars, ...supplied };
    const next = before.slice(0, start) + wrap(vars) + before.slice(start + match[0].length);
    return { file, before, next, status: next === before ? "current" : "stale", reason: next === before ? "current" : "source_changed" };
  }
  const legacy = legacyMatch(before, source, file);
  if (legacy) {
    const vars = { ...legacy.vars, ...supplied };
    let prefix = before.slice(0, legacy.start),
      suffix = before.slice(legacy.end);
    if (cursor) {
      const original = frontmatter(before.slice(legacy.start, legacy.end));
      if (!original || frontmatter(prefix)) return fail("cursor_scope_conflict");
      prefix = original.prefix + prefix;
    }
    return { file, before, next: prefix + wrap(vars) + suffix, status: "stale", reason: "legacy" };
  }
  let prefix = before;
  if (cursor && !frontmatter(before)) prefix = frontmatter(source)!.prefix + before;
  return { file, before, next: prefix + (prefix.endsWith("\n") || !prefix ? "" : "\n") + wrap(supplied), status: "stale", reason: "unmanaged" };
}
function prepare(input: Input): { root?: string; files: PlannedFile[] } {
  let root: string;
  try {
    root = workspaceRoot(path.resolve(input.target));
  } catch {
    return { files: WORKSPACE_ENTRYPOINT_FILES.map((file) => ({ file, status: "unsafe", reason: "path_unsafe" })) };
  }
  const vars = input.vars ?? {};
  if (!validVars(vars)) return { root, files: WORKSPACE_ENTRYPOINT_FILES.map((file) => ({ file, status: "unsafe", reason: "vars_invalid" })) };
  const sourceRoot = input.skillRoot ?? resolveSkillRoot(import.meta.url);
  const files = WORKSPACE_ENTRYPOINT_FILES.map((file): PlannedFile => {
    let before: string | undefined;
    try {
      before = readTarget(root, file);
    } catch (error) {
      const reason = (error as Error).message;
      return { file, status: "unsafe", reason: ["path_unsafe", "file_too_large", "file_encoding"].includes(reason) ? reason : "path_unsafe" };
    }
    let source: string;
    try {
      source = boundedFileBytes(path.join(sourceRoot, ENTRYPOINT_TEMPLATE_RELATIVE, file), LIMIT).toString("utf8");
      if (MARKER.test(source) || !source.endsWith("\n")) throw new Error();
    } catch {
      return { file, before, status: "unsafe", reason: "template_unavailable" };
    }
    try {
      const planned = planFile(file, before, source, vars);
      return planned.next !== undefined && Buffer.byteLength(planned.next) > LIMIT ? { file, before, status: "unsafe", reason: "file_too_large" } : planned;
    } catch (error) {
      return {
        file,
        before,
        status: "modified",
        reason: ["legacy_ambiguous", "vars_invalid"].includes((error as Error).message) ? (error as Error).message : "cursor_scope_conflict",
      };
    }
  });
  return { root, files };
}
function report(files: PlannedFile[], applied = false): WorkspaceEntrypointReport {
  const rank: WorkspaceEntrypointStatus[] = ["current", "missing", "stale", "modified", "unsafe"];
  const status = files.reduce<WorkspaceEntrypointStatus>(
    (result, file) => (rank.indexOf(file.status) > rank.indexOf(result) ? file.status : result),
    "current",
  );
  return {
    status,
    files: files.map(({ file, status, reason }) => ({ file, status, reason })),
    changed: files.some((file) => file.next !== undefined && file.next !== file.before),
    applied,
  };
}
/** Pure inspection: bounded metadata only; never returns workspace paths or authored text. */
export function inspectWorkspaceEntrypoints(input: Omit<Input, "vars">): WorkspaceEntrypointReport {
  return report(prepare(input).files);
}
/** Preview by default at the caller boundary; refusal of any file prevents every write. */
export function refreshWorkspaceEntrypoints(input: Input & { apply: boolean }): WorkspaceEntrypointReport {
  const prepared = prepare(input),
    result = report(prepared.files);
  if (!input.apply || result.status === "modified" || result.status === "unsafe") return result;
  // Check every path and byte again before the first write. Do not partially repair a
  // workspace when a later file is unsafe, modified, or changed during preflight.
  try {
    if (workspaceRoot(path.resolve(input.target)) !== prepared.root) throw new Error();
    for (const file of prepared.files) if (readTarget(prepared.root!, file.file) !== file.before) throw new Error();
  } catch {
    return { ...result, status: "unsafe", applied: false, files: result.files.map((file) => ({ ...file, status: "unsafe", reason: "path_changed" })) };
  }
  for (const file of prepared.files) {
    if (file.next === undefined || file.next === file.before) continue;
    const destination = path.join(prepared.root!, file.file);
    const previousMode = file.before === undefined ? undefined : lstatSync(destination).mode & 0o777;
    atomicFile(destination, file.next);
    if (previousMode !== undefined) chmodSync(destination, previousMode);
  }
  return {
    status: "current",
    files: prepared.files.map(({ file }) => ({ file, status: "current", reason: "current" })),
    changed: result.changed,
    applied: true,
  };
}
