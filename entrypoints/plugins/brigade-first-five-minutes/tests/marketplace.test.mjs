import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(dirname(dirname(pluginRoot)));

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), "utf8"));
}

function readPlugin(relativePath) {
  return readFileSync(join(pluginRoot, relativePath), "utf8");
}

test("repo marketplaces point at the portable first-five-minutes package", () => {
  const openai = readJson(".agents/plugins/marketplace.json");
  const claude = readJson(".claude-plugin/marketplace.json");
  const plugin = readJson("entrypoints/plugins/brigade-first-five-minutes/plugin.json");
  const mcp = readJson("entrypoints/plugins/brigade-first-five-minutes/mcp.json");

  assert.equal(openai.name, "brigade");
  assert.equal(openai.plugins.length, 1);
  assert.equal(openai.plugins[0].name, "brigade-first-five-minutes");
  assert.deepEqual(openai.plugins[0].source, {
    source: "local",
    path: "./entrypoints/plugins/brigade-first-five-minutes",
  });
  assert.equal(openai.plugins[0].policy.installation, "AVAILABLE");
  assert.equal(openai.plugins[0].policy.authentication, "ON_FIRST_USE");
  assert.equal(openai.plugins[0].category, "Developer Tools");

  assert.equal(claude.name, "brigade");
  assert.equal(claude.owner.name, "Clueless Creations");
  assert.equal(claude.plugins[0].name, "brigade-first-five-minutes");
  assert.equal(claude.plugins[0].source, "./entrypoints/plugins/brigade-first-five-minutes");

  assert.equal(plugin.name, "brigade-first-five-minutes");
  assert.equal(plugin.$schema, "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
  assert.match(plugin.extensions["com.openai"].interface.longDescription, /without sign-in/);
  assert.doesNotMatch(plugin.extensions["com.openai"].interface.longDescription, /entitled account/);
  assert.equal(mcp.mcpServers["brigade-knowledge"].type, "streamable-http");
  assert.equal(mcp.mcpServers["brigade-knowledge"].url, "https://mcp.clueless-creations.com/mcp");
});

test("the packaged skill does not ask users to paste a Brigade API key", () => {
  const skill = readPlugin("skills/audit-first-five-minutes/SKILL.md");
  const readme = readPlugin("README.md");
  assert.match(skill, /need no API key and no sign-in/);
  assert.doesNotMatch(skill, /paste a Brigade credential/);
  assert.match(readme, /codex plugin marketplace add Clueless-Creations\/Brigade/);
  assert.match(readme, /need no Brigade API key/);
});
