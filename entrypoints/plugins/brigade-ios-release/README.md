# Brigade iOS Release

**Finds what will get your iOS app rejected and tells you exactly how to fix it before you submit.**

This Grok plugin connects to Brigade's hosted knowledge service and adds one skill, *Ship my iOS app to TestFlight*.

This tree is a draft package. It is not listed in the xAI plugin marketplace and does not submit or change the live knowledge service.

## What it can do (read-only)

| Tool | Does |
|---|---|
| `b2c_workflow` | Loads a step-by-step release workflow (signing & readiness, TestFlight) |
| `b2c_knowledge_search` | Finds the App Store / signing / privacy reference for a problem |
| `b2c_knowledge_get` | Reads that reference with source provenance and hashes |

The skill names those three tools. Grok's `.mcp.json` has no `allowedTools` field, so the hosted server still advertises its other anonymous knowledge tools. The skill does not call them.

No sign-in, no API key, no access to your files from the server, no writes. The skill reads your project locally and only proposes changes.

Network: `https://mcp.clueless-creations.com/mcp` (Streamable HTTP). No credentials.

## Install

Point Grok at this directory, or add the hosted MCP URL in a client that accepts Streamable HTTP. Marketplace listing is a later step.

## Try it

"Ship my iOS app to TestFlight" in a repo with an Xcode project.

License: MIT.

Draft notes for a later marketplace listing live in `TEMPLATE.md` and `SUBMISSION.md`. Those files do not submit anything.
