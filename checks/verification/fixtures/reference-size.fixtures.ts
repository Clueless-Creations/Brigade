import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { assert, skillRoot, type Harness } from "./_harness.js";

const script = path.join(skillRoot, "checks/validation/repository/check-reference-size.ts");
const documentPath = "knowledge/design/example.md";

function fixtureRoot(harness: Harness, name: string): string {
  const root = harness.makeTempDir(name);
  mkdirSync(path.join(root, "knowledge/design"), { recursive: true });
  mkdirSync(path.join(root, "catalog/knowledge/design"), { recursive: true });
  writeFileSync(path.join(root, "SKILL.md"), "# Fixture skill\n");
  writeFileSync(path.join(root, "package.json"), "{}\n");
  writeFileSync(path.join(root, "skill-version.json"), '{"version":"0.0.0"}\n');
  writeFileSync(path.join(root, documentPath), "# Example\n");
  writeFileSync(
    path.join(root, "catalog/knowledge/design/example.yaml"),
    [
      "id: reference.design.example",
      "title: Example",
      "domain_id: domain.design",
      `document_path: ${documentPath}`,
      "load_when: writing the fixture example",
      "lifecycle: active",
      "bindings: {}",
      "source_exemption: Repository-original fixture.",
      "",
    ].join("\n"),
  );
  return root;
}

function writeIndex(root: string, content: string): void {
  mkdirSync(path.join(root, "catalog/generated"), { recursive: true });
  writeFileSync(path.join(root, "catalog/generated/routing.md"), content);
}

function runCheck(root: string, mode?: "pr" | "main" | "release"): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, ["--import", "tsx", script, "--skill-root", root, ...(mode ? ["--stamp-mode", mode] : [])], {
    cwd: skillRoot,
    encoding: "utf8",
    env: { ...process.env, B2C_STAMP_MODE: undefined },
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

export function register(harness: Harness): void {
  harness.check("reference size: PR/main check authored navigation before a routing stamp exists", () => {
    const root = fixtureRoot(harness, "reference-size-authored");
    for (const mode of ["pr", "main"] as const) {
      const result = runCheck(root, mode);
      assert(result.status === 0, `${mode} should accept the authored manifest\n${result.output}`);
    }
    const release = runCheck(root, "release");
    assert(release.status === 1, `release should require the committed index\n${release.output}`);
    assert(release.output.includes("reference_size.generated_index_missing"), release.output);
  });

  harness.check("reference size: release and the default mode reject a stale committed index", () => {
    const root = fixtureRoot(harness, "reference-size-stale-stamp");
    writeIndex(root, "# Stale reference index\n");
    const authored = runCheck(root, "pr");
    assert(authored.status === 0, `PR should use authored navigation\n${authored.output}`);
    for (const mode of ["release", undefined] as const) {
      const result = runCheck(root, mode);
      assert(result.status === 1, `${mode ?? "default"} should reject the stale index\n${result.output}`);
      assert(result.output.includes("reference_size.index_incomplete"), result.output);
    }
    writeIndex(root, `[Example](../../${documentPath})\n`);
    const release = runCheck(root, "release");
    assert(release.status === 0, `release should accept the linked committed index\n${release.output}`);
  });

  harness.check("reference size: PR still rejects unmanifested knowledge despite a committed link", () => {
    const root = fixtureRoot(harness, "reference-size-unmanifested");
    writeFileSync(path.join(root, "knowledge/design/unmanifested.md"), "# Unmanifested\n");
    writeIndex(root, `[Example](../../${documentPath})\n[Unmanifested](../../knowledge/design/unmanifested.md)\n`);
    const result = runCheck(root, "pr");
    assert(result.status === 1, `PR must reject unmanifested knowledge\n${result.output}`);
    assert(result.output.includes("reference_size.index_incomplete"), result.output);
    assert(result.output.includes("knowledge/design/unmanifested.md"), result.output);
  });
}
