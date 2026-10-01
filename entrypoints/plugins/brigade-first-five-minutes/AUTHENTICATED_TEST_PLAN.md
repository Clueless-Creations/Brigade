# Authenticated test plan

Reviewed 2026-10-01. Current owner approval covers the eleven-file stamp, push, and draft PR. This plan authorizes no account action, installation, registration, credential use, model call, or publication.

The smallest next approval is one temporary developer-mode MCP connection with owner-selected account/workspace/client, including client-managed registration (DCR if selected), code/token/refresh lifecycle, `b2c:read` consent, bounded knowledge-tool tests, and connection removal. The owner must approve enabling Developer mode if needed. Account/workspace policy may prevent access. No key creation, re-entitlement, or account-permission changes are included.

Following [Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt), open Settings → Security and login → Developer mode, then ChatGPT Plugins → plus → Connection; enter `https://mcp.clueless-creations.com/mcp`. Review discovered tools. Follow [OAuth authentication](https://developers.openai.com/plugins/build/auth) using the client's actual callback, issuer, and resource. CIMD and DCR are supported in source; record the selected path. DCR client longevity remains unqualified: source registrations expire after 90 days. Stop if compatibility requires callback, server, entitlement, or permission changes.

The owner enters an existing, dedicated, entitled test API key directly into the service's HTTPS consent form and chooses Allow read access. Never supply keys through chat, shell arguments, logs, or the ZIP. Source currently labels this owner access; public customer/reviewer login remains unqualified. If an appropriate key/account is absent, credential creation or entitlement provisioning needs separate approval; no purchase is implied. [Consent source](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/hosted/knowledge-mcp/oauth.ts#L26), [access checks](https://github.com/Clueless-Creations/Brigade/blob/12fd1bfd55744463c5d2bf0ac5f6fa9b6799eece/hosted/knowledge-mcp/access.ts#L16).

Keep four test routes distinct:

- Developer-mode MCP qualifies OAuth and tools; it does not run the packaged audit skill or count toward the 32-output comparison.
- Complete prepublication local testing is documented for Codex and Codex in ChatGPT desktop through a [repository marketplace](https://developers.openai.com/plugins/build/plugins#install-a-local-plugin-manually). Separately approve installation in a disposable test repository, its local marketplace/config, any host-saved installation state, and synthetic-case model usage. Keep the personal marketplace unchanged.
- A [Platform ZIP draft upload](https://developers.openai.com/plugins/deploy/submission) requires separate account approval and publisher access; its scans do not prove installed skill behavior.
- Public directory submission, publication, and workspace distribution remain separate approvals. No complete prepublication web-ChatGPT draft-package execution route was found in these docs; expose that limitation.

Use the same actual host and model for each paired comparison. A Codex test remains Codex evidence, including when opened in ChatGPT desktop; it cannot be relabeled as a plain-ChatGPT comparison. Keep the strict ChatGPT evaluation unrun until its complete-package test route and matched model access are qualified.

Positive qualification: inventory exactly four read-only knowledge tools; exercise bounded catalog, workflow route/expansion, generic search, section discovery/retrieval, hash-bound continuation, provenance, and OAuth refresh. Record sanitized schemas, arguments, errors, versions, and hashes; send no capture content.

Negative qualification: cancel consent; reject invalid/revoked/unentitled credentials, bad scope/resource, stale hashes, and unsupported execution. Use existing dedicated negative credentials or local fixtures; never revoke or suspend unrelated access. Run frozen positive/negative audit cases only after complete installation approval.

Rollback: remove the test connection and restore changed local settings. Dedicated-key revocation and server grant cleanup require explicit owner approval; verify subsequent denial and do not promise immediate global revocation. Keep secret-free evidence outside tracked source.
