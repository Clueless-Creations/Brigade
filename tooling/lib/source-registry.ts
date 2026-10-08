import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fragment files beside the main registry, in filename order. */
export function sourceRegistryFragmentPaths(registryPath: string): string[] {
  const dir = path.join(path.dirname(registryPath), "source-registry.d");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort()
    .map((name) => path.join(dir, name));
}

export function isSourceRegistryPath(filePath: string, registryPath: string): boolean {
  if (path.resolve(filePath) === path.resolve(registryPath)) return true;
  const dir = path.resolve(path.dirname(registryPath), "source-registry.d");
  const resolved = path.resolve(filePath);
  const relative = path.relative(dir, resolved);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative) && (resolved.endsWith(".yaml") || resolved.endsWith(".yml"));
}

/**
 * Rows from `source-registry.d/*.yaml`. Each file uses the main registry schema:
 * a `sources:` list. The main file is not read here.
 */
export function loadSourceRegistryFragmentRows(registryPath: string): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const file of sourceRegistryFragmentPaths(registryPath)) {
    let parsed: unknown;
    try {
      parsed = parseYaml(readFileSync(file, "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Source registry fragment ${path.basename(file)} failed to parse: ${message}`);
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.sources)) {
      throw new Error(`Source registry fragment ${path.basename(file)} must contain a sources list.`);
    }
    for (const item of parsed.sources) {
      if (isRecord(item)) rows.push(item);
    }
  }
  return rows;
}
