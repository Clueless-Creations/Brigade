import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parse } from "yaml";

export const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const endpoint = "https://mcp.clueless-creations.com/mcp";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function safeFile(root, relative) {
  assert(relative.startsWith("./"), "Package paths must start with ./");
  const parts = relative.slice(2).split("/");
  assert(parts.every((part) => part && part !== "." && part !== ".."), "Package path is not canonical");
  let candidate = path.resolve(root);
  for (const part of parts) {
    candidate = path.join(candidate, part);
    assert(!fs.lstatSync(candidate).isSymbolicLink(), "Package symlinks are forbidden");
  }
  assert(fs.statSync(candidate).isFile(), "Referenced package file is missing");
  return candidate;
}

export function packageFiles(root) {
  const files = ["plugin.json", "mcp.json", "LICENSE"];
  function walk(directory) {
    assert(!fs.lstatSync(path.join(root, directory)).isSymbolicLink(), "Package symlinks are forbidden");
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), "Package symlinks are forbidden");
      assert(!entry.name.startsWith("."), "Hidden package file forbidden");
      const name = directory + "/" + entry.name;
      assert(!/(^|\/)(?:\.env(?:\.|$)|\.git|auth\.json|credentials?)(?:\/|$)/i.test(name), "Protected file in package");
      if (entry.isDirectory()) walk(name);
      else {
        assert(entry.isFile(), "Package contains a non-regular file");
        assert(directory.startsWith("skills") ? /\.(?:md|yaml)$/.test(name) : /\.(?:svg|png|jpg|jpeg|webp)$/.test(name), "Unexpected package file type");
        files.push(name);
      }
    }
  }
  walk("skills");
  walk("assets");
  return files.sort();
}

function httpsUrl(value) {
  const parsed = new URL(value);
  assert(parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.search, "Expected credential-free HTTPS URL");
  assert(!["localhost", "127.0.0.1", "[::1]", "example.com"].includes(parsed.hostname), "Placeholder or local URL is forbidden");
}

function safeSvg(svg) {
  assert(!/<script|<foreignObject|<!DOCTYPE|<!ENTITY|\bon[a-z]+\s*=|(?:xlink:)?href\s*=\s*["'](?!#)/i.test(svg), "Active or remote SVG content forbidden");
}

function noCredentialFields(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    const credential = /^(?:apikey|accesstoken|refreshtoken|clientsecret|password|privatekey|authorization|idtoken)$/.test(key.replace(/[_-]/g, "").toLowerCase());
    assert(!credential || child === null || child === "", "Credential material in package");
    noCredentialFields(child, seen);
  }
}

export async function validate(root = pluginRoot, { submission = false, schemas } = {}) {
  const manifest = JSON.parse(fs.readFileSync(safeFile(root, "./plugin.json"), "utf8"));
  const mcp = JSON.parse(fs.readFileSync(safeFile(root, "./mcp.json"), "utf8"));
  const allowed = ["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"];
  assert(Object.keys(manifest).every((key) => allowed.includes(key)), "Unsupported portable manifest field");
  assert(manifest.$schema === "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", "Wrong plugin schema");
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name) && manifest.name.length <= 64, "Invalid stable plugin name");
  assert(/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(manifest.version), "Explicit semantic version required");
  assert(manifest.license === "MIT" && fs.readFileSync(safeFile(root, "./LICENSE"), "utf8").includes("MIT License"), "License notice missing");
  assert(mcp.$schema === "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json", "Wrong MCP schema");
  assert(Object.keys(mcp).every((key) => ["$schema", "mcpServers"].includes(key)), "Unsupported MCP configuration");
  assert(Object.keys(mcp.mcpServers).length === 1, "Exactly one MCP server required");
  const server = Object.values(mcp.mcpServers)[0];
  assert(Object.keys(server).every((key) => ["type", "url"].includes(key)), "No credentials, env, commands, or headers in MCP wiring");
  assert(server.type === "streamable-http" && server.url === endpoint, "Use the existing remote knowledge endpoint");
  httpsUrl(server.url);
  const openai = manifest.extensions?.["com.openai"];
  assert(openai && !openai.apps && !openai.hooks, "Public ZIP must not contain app mappings or hooks");
  assert(Object.keys(manifest.extensions).length === 1, "This pilot uses only the OpenAI extension");
  const listing = openai.interface;
  for (const [field, limit] of Object.entries({ displayName: 30, shortDescription: 30, longDescription: 4000, developerName: 80, category: 80 })) {
    assert(typeof listing?.[field] === "string" && listing[field].trim() && listing[field].length <= limit, "Invalid listing field: " + field);
  }
  assert(Array.isArray(listing.defaultPrompt) && listing.defaultPrompt.length <= 3, "At most three starter prompts");
  assert(listing.defaultPrompt.every((prompt) => prompt.length <= 128 && !/@/.test(prompt)), "Invalid starter prompt");
  for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
    if (listing[field]) httpsUrl(listing[field]);
  }
  for (const field of ["homepage", "repository"]) if (manifest[field]) httpsUrl(manifest[field]);
  if (manifest.author?.url) httpsUrl(manifest.author.url);
  const svg = fs.readFileSync(safeFile(root, listing.logo), "utf8");
  safeFile(root, listing.composerIcon);
  assert(/viewBox="0 0 (\d+) \1"/.test(svg) && Number(svg.match(/viewBox="0 0 (\d+)/)[1]) >= 48, "Square icon of at least 48 pixels required");
  safeSvg(svg);
  const skills = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true });
  assert(skills.length === 1 && skills[0].isDirectory() && !skills[0].isSymbolicLink(), "The pilot must contain one focused skill");
  const skillName = skills[0].name;
  const skillFile = safeFile(root, "./skills/" + skillName + "/SKILL.md");
  const content = fs.readFileSync(skillFile, "utf8");
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---\n/);
  assert(frontmatter, "Skill frontmatter missing");
  const metadata = parse(frontmatter[1]);
  noCredentialFields(metadata);
  assert(metadata.name === skillName && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName), "Skill name must match its folder");
  assert(typeof metadata.description === "string" && metadata.description.length <= 1024, "Skill description missing or oversized");
  for (const match of content.matchAll(/\]\((references\/[^)#]+)(?:#[^)]*)?\)/g)) safeFile(root, "./skills/" + skillName + "/" + match[1]);
  const cases = openai.review?.test_cases;
  assert(cases?.positive?.length === 5 && cases?.negative?.length === 3, "Prepare exactly five positive and three negative review cases");
  for (const [kind, records] of Object.entries(cases)) {
    for (const record of records) {
      assert(record.description && record.prompt && record.expected_behavior, "Review case is incomplete");
      if (kind === "positive") assert(record.tools_triggered, "Positive case needs expected tool names");
    }
  }
  assert(openai.review.commerce === false, "This pilot does not initiate commerce");
  assert(!openai.review.test_credentials && !openai.review.reviewer_instructions, "Reviewer secrets belong outside the ZIP");
  const files = packageFiles(root);
  for (const relative of files) {
    const file = safeFile(root, "./" + relative);
    assert(fs.statSync(file).size <= 5 * 1024 * 1024, "Oversized package file");
    if (/\.(?:json|md|yaml|svg)$/.test(relative)) {
      const text = fs.readFileSync(file, "utf8");
      if (relative.endsWith(".svg")) safeSvg(text);
      if (relative.endsWith(".json")) noCredentialFields(JSON.parse(text));
      if (relative.endsWith(".yaml")) noCredentialFields(parse(text));
      assert(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}|["']?\b(?:api_key|access_token|refresh_token|client_secret|password|private_key)["']?\s*[:=]\s*(?:["'][^"'\n]+["']|[^\s#,'"}]+)/i.test(text), "Credential material in package");
      assert(!/\/Users\/|\/home\/[^/]+\/|sediment:\/\/file_/.test(text), "Private or machine-bound reference in package");
    }
  }
  let schemaValidation = { status: "not_run", reason: "Pass --schemas with downloaded canonical schemas for full JSON Schema validation." };
  if (schemas) {
    const { default: Ajv2020 } = await import("ajv/dist/2020.js");
    const ajv = new Ajv2020({ strict: true, allErrors: true });
    const schemaHashes = {};
    for (const [name, value] of [["plugin", manifest], ["mcp", mcp]]) {
      const bytes = fs.readFileSync(path.join(schemas, name + ".schema.json"));
      const schema = JSON.parse(bytes);
      assert(schema.$id === value.$schema, "Canonical schema identity mismatch");
      const check = ajv.compile(schema);
      assert(check(value), "Canonical " + name + " schema rejected the package: " + JSON.stringify(check.errors));
      schemaHashes[name] = hash(bytes);
    }
    schemaValidation = { status: "passed", schemaHashes };
  }
  const submissionHolds = ["privacyPolicyURL", "termsOfServiceURL"].filter((field) => !listing[field]).map((field) => "Owner must confirm and supply " + field);
  if (!openai.review.demo_recording_url) submissionHolds.push("A reviewer-accessible recording URL is required");
  if (submission) assert(submissionHolds.length === 0, "Submission metadata held: " + submissionHolds.join("; "));
  return { package: manifest.name, version: manifest.version, formatAndLocalSafety: "passed", schemaValidation, files: files.length, manifestSha256: hash(fs.readFileSync(path.join(root, "plugin.json"))), submissionMetadata: submissionHolds.length ? "held" : "complete_not_reviewed", submissionHolds };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const value = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined;
  try {
    console.log(JSON.stringify(await validate(value("--root") ?? pluginRoot, { submission: args.includes("--submission"), schemas: value("--schemas") }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
