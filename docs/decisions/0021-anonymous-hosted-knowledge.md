# 0021 — Anonymous hosted knowledge MCP tools

- **Status:** accepted
- **Date:** 2026-10-07
- **Steward:** Eduardo (owner decision, 2026-10-07)
- **Affected rules and contracts:** hosted MCP access (`hosted/knowledge-mcp/worker.ts`); knowledge tool declarations (`kernel/knowledge-service/tools.ts`); ARCH-09 discoverability; ARCH-10 scoped effects
- **Affected units:** hosted knowledge Worker; repo plugin marketplaces

## Context and evidence

Hosted knowledge MCP required an entitled API key or OAuth grant on every `/mcp` call (`hosted/knowledge-mcp/worker.ts` before this change). The OAuth consent page asked users to paste `B2C_APP_BUILDER_API_KEY` (`hosted/knowledge-mcp/oauth.ts`). [OpenAI plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) forbid collecting access credentials such as API keys. ChatGPT and Codex can install a repo marketplace without review (`codex plugin marketplace add owner/repo`). [Plugin auth](https://developers.openai.com/plugins/build/auth) marks anonymous tools with `securitySchemes: [{ type: "noauth" }]`.

The owner decided that read-only hosted knowledge MCP tools are free and anonymous. Account extras keep sign-in.

## Alternatives

**Keep entitlement on all knowledge tools.** Reject — blocks directory reach and requires a pasted key.

**Make HTTP API anonymous as well.** Defer — this record covers MCP knowledge tools. HTTP remains key-gated as the headless extra.

**Drop OAuth.** Reject — extras that need an account still use the existing grant path.

## Decision

The four hosted knowledge tools (`b2c_catalog`, `b2c_workflow`, `b2c_knowledge_search`, `b2c_knowledge_get`) declare `securitySchemes: [{ type: "noauth" }]` and serve unauthenticated Streamable HTTP MCP calls. The current MCP TypeScript SDK drops `securitySchemes` on `registerTool`, so `registerKnowledgeTools` wraps `tools/list` to emit the field. Annotations stay `readOnlyHint: true` and `destructiveHint: false`.

HTTP `/api/v1` still requires a Bearer API key. A presented MCP bearer is still checked. OAuth consent remains for extras that need an account. Do not ask users to paste a Brigade API key to use knowledge tools.

Repo marketplaces at `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` point at `entrypoints/plugins/brigade-first-five-minutes`. That package is the minimum installable overlay of draft PR #637. Those host catalog directories join the existing `.claude` / `.codex` / `.cursor` root allowlist in `check:repository-boundary` and stay repository-only for version discipline.

## Compatibility and migration

Authenticated MCP and HTTP clients keep working. Anonymous MCP is additive. Existing keys, grants, and consent remain valid for HTTP and account extras. This record does not authorize hosted deployment, npm publish, a release, or an OpenAI, Anthropic, or Cursor directory submission.

## Consequences

Document install and access on the hosted README, console snippets, and agent guides. Preserve rate limits on anonymous MCP (ingress plus per-IP API limiter). Skip activation analytics for anonymous callers. The plugin manifest now lists privacy, terms, and support URLs. The support page must be live before submission. Directory submission still needs a measured eval, a demo recording, publisher verification, and a hosted deploy of anonymous `/mcp`.
