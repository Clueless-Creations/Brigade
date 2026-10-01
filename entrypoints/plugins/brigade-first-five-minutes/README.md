# Brigade First Five Minutes

This pilot packages one consumer-app audit for the current ChatGPT and Codex plugin platform.
Supply ordered captures, the target user, and the intended first value.
The result contains three supported friction points, a revised flow, one next test, citations, and uncertainty.
An audit may return fewer findings when the evidence does not support three.

The package is a local draft. It is not published, installed, connected to a test account, or accepted by the directory.
Its additional value over plain ChatGPT remains unmeasured.

## What is packaged

- Portable root `plugin.json` with focused metadata, three starter prompts, and five positive plus three negative review cases.
- Root `mcp.json` with one existing Streamable HTTP knowledge endpoint.
- One audit skill and its bounded reference-retrieval guide.
- Original square icon and the repository's MIT notice.

The hosted service supplies read-only knowledge. Packaging adds no app execution, persistent business profile, or hosted business runtime.
The plugin preserves existing billing boundaries and does not initiate subscriptions, checkout, or upgrade promotion.
It sends generic topic terms and public reference IDs to knowledge tools, not capture contents.

The pilot's local `.npmignore` excludes it from the canonical npm tarball.
An npm dry run verified zero pilot files and no change to the other package entries.
It changes no CLI/MCP operation, catalog owner, renderer, reducer, or hosted deployment.
The focused skill presents existing onboarding and monetization expertise through the requested audit contract.

## Reproduce local validation

Use Node.js 24 and the repository's pinned dependencies. Run commands from the repository root.
The fixture renderer uses the existing Pillow package. It does not install packages.

```bash
npm ci
python3 entrypoints/plugins/brigade-first-five-minutes/evals/render-fixtures.py
node --test entrypoints/plugins/brigade-first-five-minutes/tests/pilot.test.mjs
node entrypoints/plugins/brigade-first-five-minutes/scripts/validate.mjs
python3 entrypoints/plugins/brigade-first-five-minutes/scripts/package.py ../artifacts/brigade-first-five-minutes.zip
```

The ZIP uses fixed timestamps and an allowlist. It excludes development scripts, tests, synthetic captures, and local evaluation outputs.
Run `validate.mjs --submission` to check submission metadata. The draft deliberately fails until required policy URLs and a recording exist.
This result does not replace platform review, OAuth qualification, or utility evaluation.

For full canonical JSON Schema validation, download these public schemas into an artifact directory:

- [Plugin schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
- [MCP schema](https://agent-plugins.org/schemas/1.0.0/mcp.schema.json)

Pass that directory to `scripts/validate.mjs --schemas <directory>`.
The report records schema hashes. No network request occurs during schema validation.

`scripts/probe.mjs` prints its request plan without network access.
Its explicit `--live` option reads public health and OAuth metadata and sends an unauthenticated initialize request.
It never registers a client, grants access, exchanges tokens, or retrieves authenticated tools.

## Evaluation and publication

Read [Evaluation](EVALUATION.md) for the frozen comparison protocol and offline harness.
Read [Validation](VALIDATION.md) for observed checks, source ownership, and remaining evidence holds.
Read [Version record](VERSION_PROPOSAL.md) for the approved integration stamp and package impact.
Read [Submission readiness](SUBMISSION_READINESS.md) for completed work and owner actions.
Read [Authenticated test plan](AUTHENTICATED_TEST_PLAN.md) for the next connection approval and the separate package-testing routes.
Read [Walkthrough](WALKTHROUGH.md) for the recording procedure after an authorized test connection exists.

The [current packaging guide](https://developers.openai.com/plugins/build/plugins) defines the portable layout.
The [submission guide](https://developers.openai.com/plugins/deploy/submission) requires the MCP in the initial package.
No personal marketplace entry, account permission, deployment, or public submission is part of this local pilot.
