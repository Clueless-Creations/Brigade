# Brigade First Five Minutes

This package is the repo marketplace entry for ChatGPT desktop and Codex.
It is also the Claude Code marketplace entry in `.claude-plugin/marketplace.json`.
Supply ordered captures, the target user, and the intended first value.
The result contains supported friction, a revised flow, one next test, citations, and uncertainty.

This is the minimum portable package needed for `codex plugin marketplace add Clueless-Creations/Brigade`.
Draft PR #637 owns the fuller pilot (eval cases, synthetic captures, submission readiness).
This tree aligns with that manifest and skill. Merge overlap is expected.

The package is not published to the OpenAI directory, npm, or a Claude community listing.

## Install without review

```bash
codex plugin marketplace add Clueless-Creations/Brigade
```

Then install **Brigade First Five Minutes** from that marketplace in ChatGPT desktop or Codex.
Claude Code can register the same repository:

```bash
claude plugin marketplace add Clueless-Creations/Brigade
```

Knowledge tools on `https://mcp.clueless-creations.com/mcp` need no Brigade API key and no sign-in.
Do not paste a credential into chat. The HTTP API and extras that require an account still use a console key or OAuth.

## What is packaged

- Portable root `plugin.json` with focused metadata, starter prompts, and review cases.
- Root `mcp.json` with the existing Streamable HTTP knowledge endpoint.
- One audit skill and its bounded reference-retrieval guide.
- Original square icon and the repository's MIT notice.

The hosted service supplies read-only knowledge. Packaging adds no app execution, persistent business profile, or hosted business runtime.
The plugin does not initiate subscriptions, checkout, or upgrade promotion.
It sends generic topic terms and public reference IDs to knowledge tools, not capture contents.

`.npmignore` excludes this directory from the canonical npm tarball.

## Layout

The [current packaging guide](https://developers.openai.com/plugins/build/plugins) defines the portable layout and the repo marketplace file at `.agents/plugins/marketplace.json`.
The [Claude marketplace reference](https://code.claude.com/docs/en/plugins/marketplace-reference) defines `.claude-plugin/marketplace.json`.
The manifest lists [privacy](https://clueless-creations.com/privacy), [terms](https://clueless-creations.com/terms), and [support](https://clueless-creations.com/support/). The support page is being added in a separate site PR and must be live before a directory submission.
The measured comparison against plain ChatGPT lives on draft PR #637 (`EVALUATION.md` and `evals/eval.mjs`). This tree does not copy that harness. `prepare` and `summarize` are offline; the 32 ChatGPT runs are not.

This draft does not upload a ZIP, create a release, or submit a directory listing.
