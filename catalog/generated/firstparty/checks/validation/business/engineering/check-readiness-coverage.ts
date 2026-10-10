#!/usr/bin/env node
/**
 * check-readiness-coverage.ts — the submit-ready floor across the whole readiness ledger.
 *
 * check:native-ios owns the semantics of the iOS launch-critical matrix and check:mobai-proof
 * owns the MobAI section. This gate owns the class of gap neither sees: the AGGREGATE. When the
 * business claims it is ready to submit — a top-level `Status:`/`Readiness:` line in
 * engineering/PRODUCTION_READINESS.md, or a succeeded engineering, store-console, or apple-signing
 * lane — every result cell in every proof table must be resolved, at least one resolved row must
 * be physical-device evidence (simulator-only readiness is an error, however green), and the
 * companion readiness documents the full launch names (ACCESSIBILITY_READINESS.md,
 * APP_QUALITY.md) must exist without placeholder cells. Before a claim exists, pending rows are a
 * per-table warning so a stalled ledger stays visible without failing a day-zero workspace.
 *
 * Row-specific iOS matrix and receipt rules stay with check:native-ios. This aggregate gate
 * requires an existing artifact before any row can supply physical-device coverage.
 *
 * npm script: check:readiness-coverage
 * Usage: tsx checks/validation/business/engineering/check-readiness-coverage.ts --root /path/to/business
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { asString, getPath, issue, loadProjectState, parseCliArgs, reportAndExit, type Issue } from "../../../../tooling/lib/launch-state.js";
import { parseRenderedPipeTables, parseRenderedTopLevelStatus } from "../../../../kernel/lib/required-table-section.js";

const READINESS_PATH = "engineering/PRODUCTION_READINESS.md";
const COMPANIONS = ["engineering/ACCESSIBILITY_READINESS.md", "engineering/APP_QUALITY.md"];
const IOS_MATRIX_HEADING = "native ios launch-critical test matrix";
const RESULT_HEADERS = new Set(["result", "status", "verified"]);
const EVIDENCE_HEADERS = new Set(["evidence", "evidence path", "output path"]);
const DEVICE_HEADERS = new Set(["route", "runtime route", "device", "device / os", "device/os", "device and os"]);
const PENDING = /^(?:|pending|tbd|todo|unknown|n\/?a|—|-)$/i;
const RESOLVED_DEFERRAL = /^(?:blocked|not applicable|n-a|deferred)\b/i;
// Accept an affirmative status, optionally followed by a dated annotation. A mention of
// "passed" inside a failure, plan, or question is not a successful observation.
const PASSED = /^(?:pass(?:ed)?|done|verified|yes|complete[d]?)(?:[.!]?|\s*(?:[-–—,:]\s*|\(\s*)?20\d{2}-\d{2}-\d{2}\s*\)?)$/i;
const CLAIM_LINE =
  /^(?:Status|Readiness):\s*(?:submit[- ]ready|ready(?: (?:for|to) submit)?|production[- ]ready|release[- ]ready|store[- ]ready|upload[- ]ready)\b/im;
const PHYSICAL_DEVICE =
  /^(?:(?:(?:release|debug|signed) (?:configuration|build) on (?:a )?|(?:mobai|xcodebuildmcp) (?:on (?:a )?)?)?(?:physical device|real device)|on-device|devicectl|(?:signed )?device build|signed device)\b|^(?:iphone|ipad|pixel|samsung) [0-9a-z ]+\((?:physical )?device\)(?:$|[\s,;])/i;
const SIMULATOR = /\bsimulator\b/i;
// Negation must describe the device or its observation. Offline/no-crash test conditions
// are valid physical-device evidence; incidental "without" or "no" cannot invalidate them.
const UNOBSERVED_STATE =
  "(?:pending|planned|required|unknown|unavailable|untested|unverified|missing|blocked|deferred|simulator|preview|(?:not|never)(?: yet)? (?:tested|verified|observed|available|connected|performed|run))";
const UNOBSERVED_DEVICE = new RegExp(
  `\\b(?:no|without|not on) (?:(?:a|any|the) )?(?:(?:physical|real) )?device\\b` +
    `|\\b(?:device|on-device|devicectl|device build)(?: (?:test|testing|verification|observation|run))?(?: (?:is|was|remains))? ${UNOBSERVED_STATE}\\b` +
    `|(?:^|[;,(]\\s*)${UNOBSERVED_STATE}\\b`,
  "i",
);
const EVIDENCE_PATH = /`([^`\s]+\.(?:xcresult|png|jpe?g|mp4|mov|log|json|txt|md|html))`/gi;

interface SectionTables {
  heading: string;
  tables: ReturnType<typeof parseRenderedPipeTables>;
}

function sectionsWithTables(markdown: string): SectionTables[] {
  const sections: SectionTables[] = [];
  let heading = "(preamble)";
  let buffer: string[] = [];
  const flush = (): void => {
    const tables = parseRenderedPipeTables(buffer.join("\n"));
    if (tables.length > 0) sections.push({ heading, tables });
    buffer = [];
  };
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^ {0,3}##(?:[\t ]+|$)(.*)$/u);
    if (match) {
      flush();
      heading = (match[1] ?? "").trim();
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

function isGroundedEvidence(root: string, candidate: string): boolean {
  if (path.isAbsolute(candidate) || candidate.split(/[\\/]/).includes("..")) return false;
  const full = path.join(root, candidate);
  if (!existsSync(full)) return false;
  return /\.xcresult$/i.test(candidate) ? statSync(full).isDirectory() : statSync(full).isFile();
}

function run(): Issue[] {
  const args = parseCliArgs(process.argv.slice(2));
  const root = args.root;
  const issues: Issue[] = [];

  const loaded = loadProjectState(args);
  issues.push(...loaded.issues);
  const lane = (key: string): string | undefined => (loaded.state ? asString(getPath(loaded.state, `lanes.${key}.status`))?.toLowerCase() : undefined);
  const laneClaim = ["engineering", "store_console", "apple_signing"].some((key) => lane(key) === "succeeded");

  const readinessFile = path.join(root, READINESS_PATH);
  if (!existsSync(readinessFile)) {
    issues.push(
      issue(
        laneClaim ? "error" : "warning",
        "readiness_coverage.document_missing",
        `${READINESS_PATH} is missing; there is no readiness ledger to cover.`,
        READINESS_PATH,
      ),
    );
    return issues;
  }

  const text = readFileSync(readinessFile, "utf8");
  const topStatus = parseRenderedTopLevelStatus(text);
  const statusClaim = (topStatus.ok && CLAIM_LINE.test(`Status: ${topStatus.status.value}`)) || CLAIM_LINE.test(text);
  const claimed = laneClaim || statusClaim;

  let resolvedRows = 0;
  let physicalDeviceRows = 0;
  let simulatorRows = 0;

  for (const section of sectionsWithTables(text)) {
    const isIosMatrix = section.heading.toLowerCase().includes(IOS_MATRIX_HEADING);
    for (const table of section.tables) {
      const resultIndex = table.headers.findIndex((header) => RESULT_HEADERS.has(header));
      if (resultIndex < 0) continue;
      const evidenceIndex = table.headers.findIndex((header) => EVIDENCE_HEADERS.has(header));
      const deviceIndexes = table.headers.flatMap((header, index) => (DEVICE_HEADERS.has(header) ? [index] : []));
      let pendingInTable = 0;
      for (const row of table.rows) {
        const label = row[0]?.trim() || "(unnamed row)";
        const result = row[resultIndex]?.trim() ?? "";
        if (PENDING.test(result)) {
          pendingInTable += 1;
          if (claimed) {
            issues.push(
              issue(
                "error",
                "readiness_coverage.row_pending",
                `"${section.heading}" row "${label}" is still ${result || "empty"} while the business claims submit-ready.`,
                READINESS_PATH,
              ),
            );
          }
          continue;
        }
        if (RESOLVED_DEFERRAL.test(result)) {
          if (claimed && !/20\d{2}-\d{2}-\d{2}/.test(result)) {
            issues.push(
              issue(
                "error",
                "readiness_coverage.deferral_undated",
                `"${section.heading}" row "${label}" is ${result.split(/\s/)[0]} without a dated reason; a submit-ready ledger dates every deferral.`,
                READINESS_PATH,
              ),
            );
          }
          resolvedRows += 1;
          continue;
        }
        if (!PASSED.test(result)) {
          if (claimed) {
            issues.push(
              issue(
                "error",
                "readiness_coverage.result_invalid",
                `"${section.heading}" row "${label}" result "${result}" is neither Passed nor a dated blocked/not-applicable reason.`,
                READINESS_PATH,
              ),
            );
          }
          continue;
        }
        resolvedRows += 1;
        const deviceValues = deviceIndexes.map((index) => row[index] ?? "");
        const physicalDevice = deviceValues.some((value) => PHYSICAL_DEVICE.test(value) && !UNOBSERVED_DEVICE.test(value));
        const evidence = evidenceIndex >= 0 ? (row[evidenceIndex] ?? "") : "";
        const evidencePaths = [...evidence.matchAll(EVIDENCE_PATH)].map((match) => match[1]!);
        const missingEvidence = evidencePaths.filter((candidate) => !isGroundedEvidence(root, candidate));
        const groundedEvidence = evidencePaths.length > 0 && missingEvidence.length === 0;
        if (physicalDevice && groundedEvidence) physicalDeviceRows += 1;
        else if (deviceValues.some((value) => SIMULATOR.test(value))) simulatorRows += 1;
        if (claimed && ((!isIosMatrix && missingEvidence.length > 0) || (physicalDevice && !groundedEvidence))) {
          issues.push(
            issue(
              "error",
              "readiness_coverage.evidence_missing",
              missingEvidence.length > 0
                ? `"${section.heading}" row "${label}" cites missing evidence: ${missingEvidence.map((candidate) => `\`${candidate}\``).join(", ")}.`
                : `"${section.heading}" row "${label}" claims physical-device coverage without an existing evidence artifact in an Evidence, Evidence path, or Output path cell.`,
              READINESS_PATH,
            ),
          );
        }
      }
      if (!claimed && pendingInTable > 0) {
        issues.push(
          issue(
            "warning",
            "readiness_coverage.row_pending",
            `"${section.heading}" has ${pendingInTable} pending row(s); resolve or date-defer each before claiming submit-ready.`,
            READINESS_PATH,
          ),
        );
      }
    }
  }

  if (claimed) {
    if (resolvedRows === 0) {
      issues.push(
        issue(
          "error",
          "readiness_coverage.no_resolved_rows",
          "The business claims submit-ready but no readiness row is resolved with evidence.",
          READINESS_PATH,
        ),
      );
    }
    if (physicalDeviceRows === 0) {
      issues.push(
        issue(
          "error",
          "readiness_coverage.simulator_only",
          simulatorRows > 0
            ? `Every resolved device row is simulator proof (${simulatorRows}); submit-ready needs at least one physical-device row (Release configuration on a real device, or MobAI device evidence).`
            : "No resolved row records physical-device evidence; submit-ready needs at least one (Release configuration on a real device, or MobAI device evidence).",
          READINESS_PATH,
        ),
      );
    }
    for (const relative of COMPANIONS) {
      const full = path.join(root, relative);
      if (!existsSync(full)) {
        issues.push(issue("error", "readiness_coverage.companion_missing", `${relative} is missing; a submit-ready claim needs it.`, relative));
        continue;
      }
      const companion = readFileSync(full, "utf8");
      let pendingCells = 0;
      for (const table of parseRenderedPipeTables(companion)) {
        for (const row of table.rows) for (const cellValue of row) if (PENDING.test(cellValue.trim()) && cellValue.trim().length > 0) pendingCells += 1;
      }
      const hasRows = parseRenderedPipeTables(companion).some((table) => table.rows.length > 0);
      if (!hasRows) {
        issues.push(issue("error", "readiness_coverage.companion_empty", `${relative} has no evidence rows; a submit-ready claim needs real rows.`, relative));
      } else if (pendingCells > 0) {
        issues.push(
          issue(
            "error",
            "readiness_coverage.companion_pending",
            `${relative} still has ${pendingCells} placeholder cell(s) while the business claims submit-ready.`,
            relative,
          ),
        );
      }
    }
  }

  return issues;
}

reportAndExit("Readiness coverage check", run());
