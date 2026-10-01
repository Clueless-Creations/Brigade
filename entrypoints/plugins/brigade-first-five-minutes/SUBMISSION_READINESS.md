# Submission readiness

The local package is implementable. Public submission is held.
The pilot must demonstrate additional utility and a complete working integration before publication.
The directory does not accept unfinished trial experiences. Local format validation is not acceptance.

## Completed locally

| Item | Evidence |
| --- | --- |
| Portable package | Root manifest and MCP schema identifiers; one skill; original icon; MIT notice. |
| Existing service wiring | `mcp.json` uses the URL documented by `hosted/knowledge-mcp/README.md`. |
| Bounded source use | First-value and effort workflow IDs; revision-bound section discovery; no catalog dump. |
| Advisory scope | No new runtime, profile store, lifecycle activation, account action, or app execution. |
| Review case drafts | Five positive and three negative cases in the manifest; corresponding synthetic captures in the pilot source. |
| Evaluation preparation | Shared input packs, frozen utility criteria, negative gates, and an offline scorer. Actual results remain absent. |
| Public protocol observation | On 2026-10-01, health and both discovery routes returned 200. The resource, issuer, read scope, PKCE, DCR, and CIMD matched expectations. Unauthenticated initialize returned 401 with a Bearer challenge. |
| Protected effects | Only the source stamp, branch push, and draft PR are authorized. Plugin installation, credentials, account changes, deployment, and submission remain held. |

Raw local logs, schema bytes, package ZIP, and evaluation forms belong in the task artifact directory, outside tracked source.
The approved source stamp is applied locally. See [Version record](VERSION_PROPOSAL.md) for its exact boundary and [Validation](VALIDATION.md) for current checks.
The [Authenticated test plan](AUTHENTICATED_TEST_PLAN.md) scopes the next connection approval and identifies the available package-testing routes.
The health response reported engine version 0.221.96. It does not prove the complete deployed source or authenticated behavior.
See [Authentication](https://developers.openai.com/plugins/build/auth) for current OAuth requirements.

## Required before an installed test

1. Obtain explicit parent authorization for a temporary developer-mode connection on the named test account/workspace. Complete local-package installation needs separate approval.
2. Qualify existing-account OAuth end to end with only `b2c:read`. Use the actual callback and issuer shown by the client.
3. Supply dedicated test entitlement through an approved existing account process. Do not initiate a subscription in the plugin.
4. Qualify MCP source retrieval, fallback, tool arguments, and no capture upload. Run the complete installed capture audit only after separate package-installation approval.

The current consent source asks for an entitled API key. Its copy addresses owner access.
That source does not prove a usable public customer or reviewer login.
Inspect `hosted/knowledge-mcp/oauth.ts` and the actual consent screen before selecting a reviewer access path.
Never request a key in chat, embed one in the manifest, or put reviewer credentials in the ZIP.

The hosted README states that registered clients expire after 90 days.
Current OpenAI guidance requires keeping the registered client valid while its connection remains in use.
Qualification must address client longevity and reconnection behavior; a successful public metadata GET cannot prove either.
No auth or account change is authorized by this pilot.

## Required before submission or publication

| Hold | Owner action and acceptance evidence |
| --- | --- |
| Measured utility | Authorize matched model access; run the frozen comparison; retain raw outputs and independent ratings. |
| Privacy and terms | Confirm the published policy coverage and supply the manifest's missing HTTPS URLs. Existing site URLs appear in console source, but coverage is not qualified here. |
| Support and listing | Confirm the chosen GitHub support page and verified publisher identity are appropriate for public users. |
| OAuth and reviewer access | Supply a dedicated immediately usable reviewer account through the secure portal, with sample data and required entitlement. |
| Tool qualification | Verify authenticated schemas, security metadata, read-only annotations, source provenance, continuation, stale hashes, and entitlement failures through the real connection. |
| Attachment delivery | Publish only approved synthetic capture files at reviewer-accessible URLs, then add `file_attachment_urls` to the cases. |
| Walkthrough | Record the working installed plugin and review cases. Add the actual reviewer-accessible recording URL. |
| Publisher access | Select the owning organization/project and verified identity. An owner or authorized Apps Management Write role must handle the submission. |
| Domain verification | Complete the exact portal challenge without replacing another plugin's token. |
| Final effects | Push and draft PR are approved. Obtain separate parent authorization for installation, account changes, merge, submission, and publication as applicable. |

Do not register the draft as skills-only. The [submission guide](https://developers.openai.com/plugins/deploy/submission) requires including its MCP initially.
The source ZIP contains no registered app ID or lifecycle hook. Current public upload excludes those integrations.
Privacy, terms, recording, and authenticated review materials remain required; the package leaves them absent rather than inventing URLs.

The [plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines) allow existing paid-account access and prohibit digital subscription or credit upsells.
This pilot has no in-plugin plans, purchase links, or upgrade funnel.
Its task is to audit the user's app paywall, not sell access to Brigade.

After approval, publication is a separate owner action.
Baseline discovery uses exact-name search or a direct listing link. Enhanced distribution is selective and cannot be requested.
See [Discovery](https://developers.openai.com/plugins/deploy/app-review#discovery).
No audience growth or directory acceptance is promised.
