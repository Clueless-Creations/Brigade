#!/usr/bin/env node
// Render spec.yaml into index.html and check the spec.
// Usage: node build.mjs [spec.yaml] [out.html]
// Exit code 1 when the spec check finds errors (index.html is still written
// so the errors are visible on the page).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const here = dirname(fileURLToPath(import.meta.url));
const specPath = process.argv[2] ?? join(here, 'spec.yaml');
const outPath = process.argv[3] ?? join(here, 'index.html');
const spec = YAML.parse(readFileSync(specPath, 'utf8'));

const REQUIRED_DECISION = ['loading', 'empty', 'error'];
const ALLOWED = new Set(['default', 'loading', 'empty', 'error', 'offline', 'permission-denied', 'success']);
const errors = [];
const ids = new Set(spec.screens.map((s) => s.id));
const eventNames = new Set(spec.analytics.events.map((e) => e.name));
let stateCount = 0;

for (const s of spec.screens) {
  if (!s.states?.includes('default')) errors.push(`${s.id}: states must include default`);
  for (const st of s.states ?? []) {
    stateCount++;
    if (!ALLOWED.has(st)) errors.push(`${s.id}: unknown state "${st}"`);
    if (!s.mock?.[st]?.length) errors.push(`${s.id}: state "${st}" has no mock`);
  }
  for (const st of REQUIRED_DECISION) {
    if (!s.states?.includes(st) && !s.not_applicable?.[st]) errors.push(`${s.id}: "${st}" is neither a state nor not_applicable with a reason`);
  }
  if (!s.acceptance?.length) errors.push(`${s.id}: no acceptance rules`);
  for (const e of s.events ?? []) if (!eventNames.has(e)) errors.push(`${s.id}: event "${e}" not in analytics.events`);
  for (const blocks of Object.values(s.mock ?? {})) {
    for (const b of blocks) {
      for (const target of [b.to, b.back, b.action_to]) if (target && !ids.has(target)) errors.push(`${s.id}: tap target "${target}" is not a screen`);
    }
  }
}
for (const sh of spec.store.screenshots) if (!ids.has(sh.screen)) errors.push(`store screenshot uses unknown screen "${sh.screen}"`);
for (const need of ['landing', 'privacy', 'terms', 'support', 'delete']) {
  if (!spec.web.some((w) => w.id === need)) errors.push(`web surface "${need}" is missing`);
}
for (const need of ['app_opened', 'core_action_completed', 'paywall_viewed', 'purchase_completed']) {
  if (!eventNames.has(need)) errors.push(`analytics event "${need}" is missing`);
}
// Every non-start screen must be reachable in the click-through.
const reach = new Set([spec.screens[0].id]);
let grew = true;
while (grew) {
  grew = false;
  for (const s of spec.screens) {
    if (!reach.has(s.id)) continue;
    for (const blocks of Object.values(s.mock ?? {})) for (const b of blocks) {
      for (const t of [b.to, b.back, b.action_to]) if (t && ids.has(t) && !reach.has(t)) { reach.add(t); grew = true; }
    }
  }
}
for (const s of spec.screens) if (!reach.has(s.id)) errors.push(`${s.id}: not reachable in the prototype`);
if (spec.meta.status === 'approved' && (!spec.meta.approved_by || !spec.meta.approved_at)) errors.push('meta: approved status needs approved_by and approved_at');

const report = { errors, stateCount, screens: spec.screens.length };
const safe = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const html = readFileSync(join(here, 'template.html'), 'utf8')
  .replace('/*SPEC_JSON*/', safe(spec))
  .replace('/*REPORT_JSON*/', safe(report));
writeFileSync(outPath, html);
console.log(`${outPath}: ${report.screens} screens, ${stateCount} states, ${errors.length} errors`);
for (const e of errors) console.log(`  - ${e}`);
process.exit(errors.length ? 1 : 0);
