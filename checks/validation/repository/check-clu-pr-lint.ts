#!/usr/bin/env node
/**
 * check-clu-pr-lint — merge-gate for tracker ids on pull requests, plus a
 * structural check that every agent/lane prompt template still states the rule.
 *
 * Live PR context comes from --branch/--title/--body, B2C_PR_* env, or the
 * GitHub Actions event payload. Stamp and Dependabot branches are exempt.
 * Template inventory lives in tooling/lib/clu-pr-lint.ts.
 *
 * npm script: check:clu-pr-lint
 * Usage: tsx checks/validation/repository/check-clu-pr-lint.ts --repo-root /path/to/repo
 */
import { flagBoolean, flagString, parseFlags, reportAndExit, type Issue } from "../../../tooling/lib/launch-state.js";
import { lintPrIdentity, lintPromptTemplates, parseLinkedIssues, readGithubPullRequestEvent } from "../../../tooling/lib/clu-pr-lint.js";
import { resolveSkillRoot } from "../../../tooling/lib/skill-root.js";

const defaultRepoRoot = resolveSkillRoot(import.meta.url);
const flags = parseFlags(process.argv.slice(2), [
  { flags: ["--repo-root"], key: "repoRoot" },
  { flags: ["--branch"], key: "branch", kind: "string" },
  { flags: ["--title"], key: "title", kind: "string" },
  { flags: ["--body"], key: "body", kind: "string" },
  { flags: ["--linked-issues"], key: "linkedIssues", kind: "string" },
  { flags: ["--skip-templates"], key: "skipTemplates", kind: "boolean" },
  { flags: ["--skip-pr"], key: "skipPr", kind: "boolean" },
]);

const repoRoot = flagString(flags, "repoRoot") ?? defaultRepoRoot;
const githubEvent = readGithubPullRequestEvent(process.env.GITHUB_EVENT_PATH);
const branch = flagString(flags, "branch") ?? process.env.B2C_PR_BRANCH ?? process.env.GITHUB_HEAD_REF ?? githubEvent.headRef ?? "";
const title = flagString(flags, "title") ?? process.env.B2C_PR_TITLE ?? githubEvent.title ?? "";
const body = flagString(flags, "body") ?? process.env.B2C_PR_BODY ?? githubEvent.body ?? "";
const skipTemplates = flagBoolean(flags, "skipTemplates");
const skipPr = flagBoolean(flags, "skipPr");

const issues: Issue[] = [];
if (!skipTemplates) issues.push(...lintPromptTemplates(repoRoot));
if (!skipPr) {
  issues.push(
    ...lintPrIdentity({
      branch,
      title,
      body,
      linkedIssues: parseLinkedIssues(flagString(flags, "linkedIssues")),
    }),
  );
}

reportAndExit("CLU pull-request tracker lint", issues);
