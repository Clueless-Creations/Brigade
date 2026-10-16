import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(pluginRoot, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(join(pluginRoot, relativePath), "utf8");
}

test("Grok plugin.json uses documented metadata fields only", () => {
  const manifest = readJson(".grok-plugin/plugin.json");
  const allowed = ["name", "version", "description", "author", "homepage", "repository", "license", "keywords", "logo"];
  assert.deepEqual(Object.keys(manifest).sort(), Object.keys(manifest).filter((key) => allowed.includes(key)).sort());
  assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name) && manifest.name.length <= 64);
  assert.equal(manifest.name, "brigade-ios-release");
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/);
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.homepage, "https://clueless-creations.com/");
  assert.equal(manifest.repository, "https://github.com/Clueless-Creations/Brigade");
  assert.equal(manifest.author.name, "Clueless Creations");
  assert.equal(manifest.author.url, "https://clueless-creations.com/");
  assert.ok(Array.isArray(manifest.keywords));
  assert.ok(manifest.keywords.every((keyword) => typeof keyword === "string" && keyword.startsWith("brigade")));
  assert.equal(manifest.domains, undefined);
  assert.equal(manifest.mcpServers, undefined);
  assert.equal(manifest.skills, undefined);
});

test("Grok .mcp.json is HTTP-only and does not claim allowedTools", () => {
  const mcp = readJson(".mcp.json");
  assert.deepEqual(Object.keys(mcp), ["mcpServers"]);
  assert.deepEqual(Object.keys(mcp.mcpServers), ["brigade"]);
  const server = mcp.mcpServers.brigade;
  assert.deepEqual(Object.keys(server).sort(), ["type", "url"]);
  assert.equal(server.type, "http");
  assert.equal(server.url, "https://mcp.clueless-creations.com/mcp");
  assert.equal(server.allowedTools, undefined);
});

test("the skill names the three read-only knowledge tools and forbids Apple credentials", () => {
  const skill = readText("skills/ship-ios-testflight/SKILL.md");
  const readme = readText("README.md");
  for (const tool of ["b2c_workflow", "b2c_knowledge_search", "b2c_knowledge_get"]) {
    assert.match(skill, new RegExp(tool));
    assert.match(readme, new RegExp(tool));
  }
  assert.match(skill, /never ask for Apple credentials/i);
  assert.match(readme, /No sign-in, no API key/);
  assert.match(readme, /not listed in the xAI plugin marketplace/);
});
