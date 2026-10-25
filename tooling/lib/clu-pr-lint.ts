/**
 * Tracker-link lint for pull requests and the prompt templates that tell agents
 * how to open them.
 *
 * Observed failure: agents opened PRs with no CLU id, or named the id only in
 * the body (GitHub will not auto-close from a body-only mention), or pointed a
 * PR at an already-Done umbrella. Linear then lagged GitHub.
 *
 * The merge gate requires `CLU-###` in the branch name AND the PR title. Body
 * mentions do not count. A PR whose only targeted issue is a Done umbrella
 * fails; open a child instead of reopening the umbrella.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { issue, type Issue } from "./launch-state.js";

export const TRACKER_RULE =
  "When this work opens a pull request, put `CLU-###` in the branch name AND the PR title. If no issue exists, open one first. A PR that points only at a Done umbrella needs a child issue. Never reopen the Done umbrella.";

/** Exact phrases every agent/lane prompt template and the PR template must retain. */
export const REQUIRED_TEMPLATE_PHRASES = [
  "`CLU-###` in the branch name AND the PR title",
  "If no issue exists, open one first",
  "A PR that points only at a Done umbrella needs a child issue",
  "Never reopen the Done umbrella",
] as const;

/**
 * Authored prompt and PR templates that tell an agent how to open a pull request.
 * Host adapters stay thin and are not listed. Generated stamp copies are not listed.
 */
export const TRACKER_PROMPT_TEMPLATES = [
  ".github/PULL_REQUEST_TEMPLATE.md",
  "CONTRIBUTING.md",
  "AGENTS.md",
  "agents/skills/b2c-maintainer/SKILL.md",
  "agents/skills/b2c-contributor/SKILL.md",
  "surfaces/workspace-template/repo-agent-entrypoints/AGENTS.md",
  "examples/workspace/business/engineering/app-agent-roster/APP_AGENTS.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/orchestrator.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/operator-readiness.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/launch-surface-producer.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/accessibility-device-qa.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/backend-infrastructure-engineer.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/copy-specialist.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/customer-success.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/design-guru.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/engineering-leader.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/marketing-guru.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/mobile-engineer.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/product-leader.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/research-strategist.md",
  "examples/workspace/business/engineering/app-agent-roster/agents/security-architect.md",
  "kernel/session/worker-prompt.ts",
] as const;

const CLU_ID_PATTERN = /\bCLU-(\d+)\b/giu;

export interface LinkedIssue {
  readonly id: string;
  readonly status: string;
  readonly umbrella: boolean;
}

export interface PrIdentity {
  readonly branch: string;
  readonly title: string;
  readonly body: string;
  readonly linkedIssues?: readonly LinkedIssue[];
}

export function extractCluIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(CLU_ID_PATTERN)) {
    ids.add(`CLU-${match[1]}`);
  }
  return [...ids];
}

export function isExemptBranch(branch: string): boolean {
  return /^(?:release\/stamp-|dependabot\/)/iu.test(branch.trim());
}

function isDoneStatus(status: string): boolean {
  return /^(?:done|completed)$/iu.test(status.trim());
}

function normalizeIssueId(id: string): string {
  const match = /^(?:CLU-)?(\d+)$/iu.exec(id.trim());
  return match ? `CLU-${match[1]}` : id.trim().toUpperCase();
}

export function lintPrIdentity(pr: PrIdentity): Issue[] {
  const branch = pr.branch.trim();
  const title = pr.title.trim();
  if (!branch && !title && !pr.body.trim()) return [];
  if (isExemptBranch(branch)) return [];

  const issues: Issue[] = [];
  const branchIds = extractCluIds(branch);
  const titleIds = extractCluIds(title);
  const bodyIds = extractCluIds(pr.body);
  const identityIds = [...new Set([...branchIds, ...titleIds])];

  if (branchIds.length === 0 && titleIds.length === 0) {
    const code = bodyIds.length > 0 ? "clu_pr.body_only_id" : "clu_pr.missing_id";
    const detail =
      bodyIds.length > 0
        ? `Branch and title have no CLU-### id. A body-only mention (${bodyIds.join(", ")}) does not count and will not auto-close the issue.`
        : "Branch and title have no CLU-### id. Put the id in the branch name AND the PR title. If no issue exists, open one first.";
    issues.push(issue("error", code, detail, "pull-request"));
    return issues;
  }
  if (branchIds.length === 0) {
    issues.push(
      issue(
        "error",
        "clu_pr.missing_id",
        `Branch name has no CLU-### id (title has ${titleIds.join(", ")}). Put the same id in the branch name AND the PR title.`,
        "pull-request",
      ),
    );
  }
  if (titleIds.length === 0) {
    issues.push(
      issue(
        "error",
        "clu_pr.missing_id",
        `PR title has no CLU-### id (branch has ${branchIds.join(", ")}). Put the same id in the branch name AND the PR title.`,
        "pull-request",
      ),
    );
  }
  if (issues.length > 0) return issues;

  if (!pr.linkedIssues || pr.linkedIssues.length === 0) return issues;

  const byId = new Map(pr.linkedIssues.map((linked) => [normalizeIssueId(linked.id), linked]));
  const resolved = identityIds.map((id) => byId.get(id)).filter((linked): linked is LinkedIssue => linked !== undefined);
  if (resolved.length === 0) return issues;

  const onlyDoneUmbrella = resolved.every((linked) => linked.umbrella && isDoneStatus(linked.status));
  if (onlyDoneUmbrella) {
    issues.push(
      issue(
        "error",
        "clu_pr.done_umbrella_only",
        `Branch and title point only at Done umbrella ${resolved.map((linked) => normalizeIssueId(linked.id)).join(", ")}. Open a child issue. Never reopen the Done umbrella.`,
        "pull-request",
      ),
    );
  }
  return issues;
}

export function lintPromptTemplates(repoRoot: string, read: (relative: string) => string | undefined = defaultRead(repoRoot)): Issue[] {
  const issues: Issue[] = [];
  for (const relative of TRACKER_PROMPT_TEMPLATES) {
    const text = read(relative);
    if (text === undefined) {
      issues.push(issue("error", "clu_pr.template_missing", `Tracker prompt template is missing: ${relative}.`, relative));
      continue;
    }
    const missing = REQUIRED_TEMPLATE_PHRASES.filter((phrase) => !text.includes(phrase));
    if (missing.length > 0) {
      issues.push(issue("error", "clu_pr.template_rule_missing", `${relative} is missing the tracker-link rule: ${missing.join("; ")}.`, relative));
    }
  }
  return issues;
}

function defaultRead(repoRoot: string): (relative: string) => string | undefined {
  return (relative: string): string | undefined => {
    const absolute = path.join(repoRoot, relative);
    if (!existsSync(absolute)) return undefined;
    return readFileSync(absolute, "utf8");
  };
}

export function parseLinkedIssues(raw: string | undefined): LinkedIssue[] | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("--linked-issues must be a JSON array");
  }
  return parsed.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`--linked-issues[${index}] must be an object`);
    }
    const record = item as { id?: unknown; status?: unknown; umbrella?: unknown };
    if (typeof record.id !== "string" || typeof record.status !== "string" || typeof record.umbrella !== "boolean") {
      throw new Error(`--linked-issues[${index}] needs string id, string status, and boolean umbrella`);
    }
    return { id: record.id, status: record.status, umbrella: record.umbrella };
  });
}

export interface GithubPullRequestEvent {
  readonly title?: string;
  readonly body?: string;
  readonly headRef?: string;
}

export function readGithubPullRequestEvent(eventPath: string | undefined): GithubPullRequestEvent {
  if (!eventPath || !existsSync(eventPath)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(eventPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const pullRequest = (parsed as { pull_request?: unknown }).pull_request;
    if (!pullRequest || typeof pullRequest !== "object" || Array.isArray(pullRequest)) return {};
    const record = pullRequest as { title?: unknown; body?: unknown; head?: unknown };
    const head = record.head && typeof record.head === "object" && !Array.isArray(record.head) ? (record.head as { ref?: unknown }) : undefined;
    return {
      title: typeof record.title === "string" ? record.title : undefined,
      body: typeof record.body === "string" ? record.body : undefined,
      headRef: typeof head?.ref === "string" ? head.ref : undefined,
    };
  } catch {
    return {};
  }
}
