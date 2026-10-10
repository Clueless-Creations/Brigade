import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type Harness, writeBusinessEntrypoints } from "./_harness.js";

/**
 * Continuity entrypoint checks: startup routing, thin host adapters, and the
 * warning-tier length budget. These static checks do not prove agent execution.
 */
export function register(h: Harness): void {
  const { makeFixture, runFixture, runFixtureJson } = h;

  const overBudget = makeFixture("continuity-length-over-budget");
  writeBusinessEntrypoints(overBudget);
  const agentsPath = path.join(overBudget, "AGENTS.md");
  const original = readFileSync(agentsPath, "utf8");
  // Pad past the 150-line budget with non-terminal lines — the pinned phrases requireTerms
  // checks stay intact, so only the new length check should fire.
  const padded = `${original}\n${Array.from({ length: 160 }, (_, i) => `Padding line ${i} kept off the pinned-phrase list.`).join("\n")}\n`;
  writeFileSync(agentsPath, padded, "utf8");

  runFixture("an AGENTS.md over the line budget still passes (warning only)", overBudget, "check-continuity-contract.ts", 0);
  runFixtureJson(
    "an AGENTS.md over the line budget reports continuity.entrypoint_too_long without failing",
    overBudget,
    "check-continuity-contract.ts",
    0,
    "continuity.entrypoint_too_long",
  );
  const wrongState = makeFixture("continuity-yaml-state-routing");
  writeBusinessEntrypoints(wrongState);
  const wrongAgents = path.join(wrongState, "AGENTS.md");
  writeFileSync(wrongAgents, `${readFileSync(wrongAgents, "utf8")}\nRead state/runtime.yaml before planning.\n`);
  runFixtureJson("entrypoints refuse YAML runtime state routing", wrongState, "check-continuity-contract.ts", 1, "continuity.internal_detail");

  // Advanced commands are optional documentation, not the normal startup contract.
  const noAdvanced = makeFixture("continuity-without-advanced-controls");
  writeBusinessEntrypoints(noAdvanced);
  const noAdvancedAgents = path.join(noAdvanced, "AGENTS.md");
  writeFileSync(noAdvancedAgents, readFileSync(noAdvancedAgents, "utf8").replace(/## Advanced session controls[\s\S]*?(?=## )/, ""));
  runFixtureJson("business startup passes without advanced session documentation", noAdvanced, "check-continuity-contract.ts", 0);

  for (const command of ["business-status", "business-plan"]) {
    const missingCommand = makeFixture(`continuity-start-without-${command}`);
    writeBusinessEntrypoints(missingCommand);
    const missingCommandAgents = path.join(missingCommand, "AGENTS.md");
    // Remove only the first occurrence in Start. Other sections still name the
    // business command, so a whole-file mention check would miss this regression.
    writeFileSync(missingCommandAgents, readFileSync(missingCommandAgents, "utf8").replace(`b2c ${command}`, "startup command unavailable"));
    runFixtureJson(`startup requires ${command} in Start`, missingCommand, "check-continuity-contract.ts", 1, "continuity.term_missing");
  }

  const missingStart = makeFixture("continuity-start-heading-missing");
  writeBusinessEntrypoints(missingStart);
  const missingStartAgents = path.join(missingStart, "AGENTS.md");
  writeFileSync(missingStartAgents, readFileSync(missingStartAgents, "utf8").replace("## Start", "## Other instructions"));
  runFixtureJson("host adapter startup target must exist", missingStart, "check-continuity-contract.ts", 1, "continuity.term_missing");

  for (const adapter of ["CLAUDE.md", ".cursor/rules/agents.mdc"]) {
    const legacyAdapter = makeFixture(`continuity-legacy-${path.basename(adapter)}`);
    writeBusinessEntrypoints(legacyAdapter);
    const adapterPath = path.join(legacyAdapter, adapter);
    writeFileSync(adapterPath, `${readFileSync(adapterPath, "utf8")}\nStart with b2c status, then b2c plan.\n`);
    runFixtureJson(`${adapter} cannot override startup with legacy commands`, legacyAdapter, "check-continuity-contract.ts", 1, "continuity.internal_detail");
  }
}
