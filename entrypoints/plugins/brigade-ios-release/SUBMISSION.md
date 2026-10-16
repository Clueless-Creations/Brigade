# Brigade marketplace submission (DRAFT, not submitted)
Form: https://x.ai/bot/marketplace/submit-a-plugin
- First/Last name: Eduardo / Muth Martinez
- Work email: DECISION
- Organization name: Clueless Creations; handle: clueless-creations (DECISION)
- Website: https://clueless-creations.com/
- Logotype URL: DECISION (needs 1:1 SVG/PNG with background plate, hosted publicly)
- Listed on: Grok Bot + Cursor (Grok coming soon)
- MCP Server URL or public repo: public repo at pinned SHA (DECISION: new repo vs Clueless-Creations/Brigade); MCP https://mcp.clueless-creations.com/mcp
- Brief description: "Finds what will get your iOS app rejected and tells you exactly how to fix it before you submit. Read-only, no sign-in."
- Testing instructions: Connect the MCP (no auth needed). Verified 2026-10-15 9:15 PM CT: /health ok, engine 0.221.134; tools/list returns b2c_catalog, b2c_workflow, b2c_knowledge_search, b2c_knowledge_get. Test 1: b2c_workflow {workflowId:"workflow.store.apple-testflight-standing-envelope"} returns steps. Test 2: b2c_knowledge_search {query:"privacy manifest"} returns references with provenance. Test 3: run skill "Ship my iOS app to TestFlight" in any sample Xcode project; expect a blocker/warning checklist and no write or upload actions. No demo credentials needed; no write tools.
- Checkbox "tested locally and in-app": needs a real in-app test before ticking.
Marketplace index entry (xai-org/plugin-marketplace PR, later): {"name":"brigade-ios-release","source":{"type":"url","url":"<public repo>","sha":"<40-char>"},"description":"...","category":"deployment","keywords":[...]}
