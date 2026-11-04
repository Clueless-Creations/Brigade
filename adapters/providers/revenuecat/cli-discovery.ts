import path from "node:path";
import { parseVersion, probeExecutablesOnPath, type ExecutableCandidate } from "../../../kernel/contribution/host-observe.js";
import {
  CLI_PROCESS_DISCOVERY_TIMEOUT_MS,
  assertTrustedCliProcessRequest,
  buildCliProcessEnv,
  defaultCliProcessRunner,
  type CliProcessRequest,
  type CliProcessResult,
  type CliProcessRunner,
} from "./cli-process.js";
import { REVIEWED_MUTATION_FLAGS } from "./cli-command-schema.js";
import { REVENUECAT_CLI_VERSION_PATTERN } from "./cli-operations.js";

const IDENTITY_TOKENS = ["revenuecat", "offerings", "entitlements", "rc version"] as const;
const REQUIRED_SCHEMA_COMMANDS = [
  "offerings",
  "customers",
  "apps",
  "projects",
  "entitlements",
  "products",
  "packages",
  "paywalls",
  "subscriptions",
  "metrics",
  "charts",
  "audit",
] as const;

export type RevenueCatCliDiscoveryCode =
  | "missing"
  | "unrelated-executable"
  | "unsupported-version"
  | "unsupported-schema"
  | "trusted";

export interface RevenueCatCliExecutable {
  readonly path: string;
  readonly version: string | null;
  readonly commandName: "rc" | "revenuecat";
  readonly pathOrder: number;
}

export interface RevenueCatCliDiscovery {
  readonly code: RevenueCatCliDiscoveryCode;
  readonly selected: RevenueCatCliExecutable | null;
  readonly candidates: readonly RevenueCatCliExecutable[];
  readonly schemaCommands: readonly string[];
  /** Reviewed flags the CLI does not list, or that its schema document was unreadable. Non-empty holds every mutation before spawn; reads continue. */
  readonly flagCheckFailures: readonly string[];
  readonly message: string;
}

export interface DiscoverRevenueCatCliInput {
  readonly isolatedHome: string;
  readonly cwd: string;
  readonly pathEnv?: string;
  readonly probeExecutables?: (command: string) => ExecutableCandidate[];
  readonly run: CliProcessRunner;
}

function versionProbeRequest(executable: string, cwd: string, isolatedHome: string, pathEnv: string): CliProcessRequest {
  return {
    executable,
    argv: ["--version"],
    cwd,
    env: buildCliProcessEnv({ isolatedHome, pathValue: pathEnv }),
    timeoutMs: CLI_PROCESS_DISCOVERY_TIMEOUT_MS,
  };
}

function looksLikeRevenueCat(result: CliProcessResult): boolean {
  const text = `${result.stdout}\n${result.stderr}`.toLowerCase();
  return IDENTITY_TOKENS.some((token) => text.includes(token));
}

function parseCliVersion(result: CliProcessResult): string | null {
  return parseVersion(`${result.stdout}\n${result.stderr}`, REVENUECAT_CLI_VERSION_PATTERN);
}

function commandNameFor(executable: string): "rc" | "revenuecat" {
  return path.basename(executable) === "revenuecat" ? "revenuecat" : "rc";
}

/** Top-level names only. `rc commands --json` nests subcommands, and `offerings packages` is not the `packages` family. */
function schemaCommandNames(root: unknown): string[] {
  const commands = Array.isArray(root) ? root : (root as { commands?: unknown } | null)?.commands;
  if (!Array.isArray(commands)) return [];
  const names = new Set<string>();
  for (const entry of commands) {
    const name = typeof entry === "string" ? entry : (entry as { name?: unknown } | null)?.name;
    if (REQUIRED_SCHEMA_COMMANDS.includes(name as (typeof REQUIRED_SCHEMA_COMMANDS)[number])) names.add(name as string);
  }
  return [...names].sort();
}

interface CommandNode {
  readonly name?: unknown;
  readonly flags?: unknown;
  readonly commands?: unknown;
}

function commandNode(root: unknown, path: readonly string[]): CommandNode | undefined {
  let node = root as CommandNode | undefined;
  for (const part of path) {
    const children: CommandNode[] = Array.isArray(node?.commands) ? node.commands : [];
    node = children.find((child) => child?.name === part);
  }
  return node;
}

function missingReviewedFlags(root: unknown): string[] {
  const missing: string[] = [];
  for (const { command, flags } of REVIEWED_MUTATION_FLAGS) {
    const listed: CommandNode[] = commandNode(root, command)?.flags as CommandNode[];
    const installed = new Set(Array.isArray(listed) ? listed.map((flag) => flag?.name) : []);
    for (const flag of flags) if (!installed.has(flag)) missing.push(`${command.join(" ")} --${flag}`);
  }
  return missing;
}

function reviewedFlagFailures(run: CliProcessRunner, request: CliProcessRequest): string[] {
  try {
    const schemas = run({ ...request, argv: ["commands", "--schemas", "--json", "--no-input", "--no-color"] });
    const document = schemas.status === 0 && !schemas.truncated ? parseCommandsDocument(schemas.stdout) : undefined;
    if (document?.ok) return missingReviewedFlags(document.root);
  } catch {
    // A failed probe holds mutations through the return below; it must not stop reads.
  }
  return ["commands --schemas unreadable"];
}

function parseCommandsDocument(stdout: string): { ok: true; names: readonly string[]; root: unknown } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout) as unknown;
  } catch {
    return { ok: false, reason: "commands --json did not return JSON" };
  }
  if (parsed === null || (typeof parsed !== "object" && !Array.isArray(parsed))) {
    return { ok: false, reason: "commands --json envelope is not an object or array" };
  }
  const declared = (parsed as { schema_version?: unknown }).schema_version;
  if (declared !== undefined && declared !== 1 && declared !== "1") {
    return { ok: false, reason: `commands --json schema_version ${String(declared)} is not supported` };
  }
  const root = parsed && typeof parsed === "object" && !Array.isArray(parsed) && "data" in parsed ? (parsed as { data: unknown }).data : parsed;
  const names = schemaCommandNames(root);
  return { ok: true, names, root };
}

export function discoverRevenueCatCli(input: DiscoverRevenueCatCliInput): RevenueCatCliDiscovery {
  const pathEnv = input.pathEnv ?? "";
  const probe = input.probeExecutables ?? ((command: string) => probeExecutablesOnPath(command, { PATH: pathEnv }));
  const seen = new Set<string>();
  const raw: Array<ExecutableCandidate & { commandName: "rc" | "revenuecat" }> = [];
  for (const command of ["rc", "revenuecat"] as const) {
    for (const candidate of probe(command)) {
      if (seen.has(candidate.path)) continue;
      seen.add(candidate.path);
      raw.push({ ...candidate, commandName: command });
    }
  }
  raw.sort((left, right) => left.pathOrder - right.pathOrder || left.path.localeCompare(right.path));

  const identified: RevenueCatCliExecutable[] = [];
  const unrelated: RevenueCatCliExecutable[] = [];
  for (const candidate of raw) {
    const request = versionProbeRequest(candidate.path, input.cwd, input.isolatedHome, pathEnv);
    let result: CliProcessResult;
    try {
      assertTrustedCliProcessRequest(request);
      result = input.run(request);
    } catch {
      unrelated.push({ path: candidate.path, version: null, commandName: candidate.commandName, pathOrder: candidate.pathOrder });
      continue;
    }
    const version = parseCliVersion(result);
    const executable: RevenueCatCliExecutable = {
      path: candidate.path,
      version,
      commandName: commandNameFor(candidate.path),
      pathOrder: candidate.pathOrder,
    };
    if (looksLikeRevenueCat(result)) {
      identified.push(executable);
      continue;
    }
    if (result.status !== 0 || version === null) {
      unrelated.push(executable);
      continue;
    }
    const schemaRequest: CliProcessRequest = {
      executable: candidate.path,
      argv: ["commands", "--json", "--no-input", "--no-color"],
      cwd: input.cwd,
      env: buildCliProcessEnv({ isolatedHome: input.isolatedHome, pathValue: pathEnv }),
      timeoutMs: CLI_PROCESS_DISCOVERY_TIMEOUT_MS,
    };
    const schemaResult = input.run(schemaRequest);
    const document = schemaResult.status === 0 ? parseCommandsDocument(schemaResult.stdout) : { ok: false as const, reason: "exit" };
    if (document.ok && REQUIRED_SCHEMA_COMMANDS.every((name) => document.names.includes(name))) identified.push(executable);
    else unrelated.push(executable);
  }

  if (!identified.length) {
    if (!raw.length) {
      return {
        code: "missing",
        selected: null,
        candidates: [],
        schemaCommands: [],
        flagCheckFailures: [],
        message: `No RevenueCat CLI executable named rc or revenuecat was found. Install is founder-gated; the builder will not install it.`,
      };
    }
    return {
      code: "unrelated-executable",
      selected: null,
      candidates: unrelated,
      schemaCommands: [],
      flagCheckFailures: [],
      message: `Found executable(s) named rc/revenuecat that did not identify as RevenueCat CLI. An unrelated rc binary is not the provider.`,
    };
  }

  const selected = identified[0]!;
  if (selected.version === null) {
    return {
      code: "unsupported-version",
      selected,
      candidates: identified,
      schemaCommands: [],
      flagCheckFailures: [],
      message: `RevenueCat CLI at ${selected.path} did not report a parseable version.`,
    };
  }

  const schemaRequest: CliProcessRequest = {
    executable: selected.path,
    argv: ["commands", "--json", "--no-input", "--no-color"],
    cwd: input.cwd,
    env: buildCliProcessEnv({ isolatedHome: input.isolatedHome, pathValue: pathEnv }),
    timeoutMs: CLI_PROCESS_DISCOVERY_TIMEOUT_MS,
  };
  const schemaResult = input.run(schemaRequest);
  if (schemaResult.status !== 0) {
    return {
      code: "unsupported-schema",
      selected,
      candidates: identified,
      schemaCommands: [],
      flagCheckFailures: [],
      message: `RevenueCat CLI ${selected.version} at ${selected.path} did not return a usable commands --json document (exit ${schemaResult.status ?? "null"}).`,
    };
  }
  const document = parseCommandsDocument(schemaResult.stdout);
  if (!document.ok) {
    return {
      code: "unsupported-schema",
      selected,
      candidates: identified,
      schemaCommands: [],
      flagCheckFailures: [],
      message: `RevenueCat CLI ${selected.version} produced incompatible command discovery output: ${document.reason}.`,
    };
  }
  const missing = REQUIRED_SCHEMA_COMMANDS.filter((name) => !document.names.includes(name));
  if (missing.length) {
    return {
      code: "unsupported-schema",
      selected,
      candidates: identified,
      schemaCommands: document.names,
      flagCheckFailures: [],
      message: `RevenueCat CLI ${selected.version} command tree is missing required families: ${missing.join(", ")}.`,
    };
  }
  return {
    code: "trusted",
    selected,
    candidates: identified,
    schemaCommands: document.names,
    flagCheckFailures: reviewedFlagFailures(input.run, schemaRequest),
    message: `Trusted RevenueCat CLI ${selected.version} at ${selected.path}.`,
  };
}

export const defaultDiscoverRunner: CliProcessRunner = defaultCliProcessRunner;
