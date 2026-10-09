#!/usr/bin/env node
// Render spec.yaml into index.html and check the spec.
// Usage: node build.mjs [spec.yaml] [out.html]
//        node build.mjs --list-checks
// Exit code 1 when the spec check finds errors (index.html is still written
// so the errors are visible on the page).
//
// Checks live in checks/*.mjs, loaded in filename order. Review-page sections
// live in sections/*.js. ctx carries screenIds, eventNames, webIds, reach, and tasks.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import YAML from "yaml";
import { createHash } from "node:crypto";
import { deriveTasks } from "./assignments.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function reachability(spec, screenIds) {
  const reach = new Set([spec.screens[0].id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const screen of spec.screens) {
      if (!reach.has(screen.id)) continue;
      for (const blocks of Object.values(screen.mock ?? {})) {
        for (const block of blocks) {
          for (const target of [block.to, block.back, block.action_to]) {
            if (target && screenIds.has(target) && !reach.has(target)) {
              reach.add(target);
              grew = true;
            }
          }
        }
      }
    }
  }
  return reach;
}

function buildContext(spec) {
  const screenIds = new Set(spec.screens.map((screen) => screen.id));
  const eventNames = new Set(spec.analytics.events.map((event) => event.name));
  const webIds = new Set(spec.web.map((page) => page.id));
  return { screenIds, eventNames, webIds, reach: reachability(spec, screenIds), tasks: deriveTasks(spec) };
}

async function loadChecks() {
  const dir = join(here, "checks");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".mjs"))
    .sort();
  const modules = [];
  for (const file of files) {
    const loaded = await import(pathToFileURL(join(dir, file)).href);
    modules.push({ file, ...loaded });
  }
  return modules;
}

function sectionScript() {
  const dir = join(here, "sections");
  if (!existsSync(dir)) return "";
  return readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .sort()
    .map((name) => readFileSync(join(dir, name), "utf8"))
    .join("\n");
}

function inject(html, marker, value) {
  const parts = html.split(marker);
  if (parts.length !== 2) throw new Error(`template is missing ${marker}`);
  return parts[0] + value + parts[1];
}

function stateCountOf(spec) {
  let stateCount = 0;
  for (const screen of spec.screens) stateCount += (screen.states ?? []).length;
  return stateCount;
}

const checks = await loadChecks();
const listChecks = process.argv.includes("--list-checks");
if (listChecks) {
  for (const mod of checks) console.log(`${mod.id}: ${mod.describe}`);
  process.exit(0);
}

const args = process.argv.slice(2).filter((arg) => arg !== "--list-checks");
const specPath = args[0] ?? join(here, "spec.yaml");
const outPath = args[1] ?? join(here, "index.html");
const specBytes = readFileSync(specPath);
const spec = YAML.parse(specBytes.toString("utf8"));
const ctx = buildContext(spec);
ctx.source = {
  file: basename(specPath),
  sha256: createHash("sha256").update(specBytes).digest("hex"),
  spec_version: spec.meta?.spec_version,
  status: spec.meta?.status,
};
const errors = [];
for (const mod of checks) {
  if (typeof mod.check !== "function") {
    errors.push(`check module ${mod.file}: missing check()`);
    continue;
  }
  errors.push(...mod.check(spec, ctx));
}
const outDir = dirname(outPath);
for (const mod of checks) {
  if (typeof mod.emit !== "function") continue;
  const files = mod.emit(spec, ctx) ?? {};
  for (const [filename, contents] of Object.entries(files)) {
    if (!filename || filename !== basename(filename)) {
      errors.push(`check module ${mod.file}: emit filename "${filename}" must be a single file name`);
      continue;
    }
    writeFileSync(join(outDir, filename), contents);
  }
}

const stateCount = stateCountOf(spec);
const report = { errors, stateCount, screens: spec.screens.length, tasks: ctx.tasks, source: ctx.source };
// "<" would close the surrounding script tag. JSON.stringify leaves it raw.
// \u003c keeps the tag intact and JSON.parse restores "<". An angle-bracket
// placeholder then sits in the generated file as that escape, so example
// URLs in spec.yaml use a plain host.
const safe = (value) => JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
const html = inject(
  inject(inject(readFileSync(join(here, "template.html"), "utf8"), "/*SPEC_JSON*/", safe(spec)), "/*REPORT_JSON*/", safe(report)),
  "/*SECTIONS_JS*/",
  sectionScript(),
);
writeFileSync(outPath, html);
console.log(`${outPath}: ${report.screens} screens, ${stateCount} states, ${errors.length} errors`);
for (const error of errors) console.log(`  - ${error}`);
process.exit(errors.length ? 1 : 0);
