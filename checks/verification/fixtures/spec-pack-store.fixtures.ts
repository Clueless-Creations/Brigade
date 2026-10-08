// CLU-108: store.creative_assets. The example must pass. A missing block and a block
// with no product-page header must fail.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

type CreativeAsset = { id?: string; placement?: string };

function runBuild(specPath: string, outPath: string): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}` };
}

function loadExample(work: string): { specPath: string; outPath: string; spec: { store?: { creative_assets?: CreativeAsset[] } } } {
  const specPath = path.join(work, "spec.yaml");
  copyFileSync(path.join(exampleDir, "spec.yaml"), specPath);
  const spec = YAML.parse(readFileSync(specPath, "utf8")) as { store?: { creative_assets?: CreativeAsset[] } };
  return { specPath, outPath: path.join(work, "index.html"), spec };
}

export function register(harness: Harness): void {
  harness.check("spec-pack store.creative_assets example includes a product-page header and passes", () => {
    const { specPath, outPath, spec } = loadExample(harness.makeTempDir("spec-pack-store-ok"));
    const assets = spec.store?.creative_assets ?? [];
    assert(
      assets.some((asset) => asset.placement === "product-page header" || asset.id === "product-page-header"),
      "the example spec must include a product-page header creative asset",
    );
    const result = runBuild(specPath, outPath);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    assert(result.output.includes("0 errors"), `expected "0 errors" in output\n${result.output}`);
  });

  harness.check("spec-pack build.mjs fails when store.creative_assets is missing", () => {
    const { specPath, outPath, spec } = loadExample(harness.makeTempDir("spec-pack-store-missing"));
    assert(spec.store !== undefined, "example spec must include store");
    delete spec.store.creative_assets;
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, outPath);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("store.creative_assets is missing"), `missing missing-block message\n${result.output}`);
  });

  harness.check("spec-pack build.mjs fails when store.creative_assets has no product-page header", () => {
    const { specPath, outPath, spec } = loadExample(harness.makeTempDir("spec-pack-store-no-header"));
    const assets = spec.store?.creative_assets ?? [];
    spec.store!.creative_assets = assets.filter((asset) => asset.id !== "product-page-header" && asset.placement !== "product-page header");
    assert((spec.store!.creative_assets ?? []).length > 0, "the no-header fixture must keep another creative asset");
    writeFileSync(specPath, YAML.stringify(spec));
    const result = runBuild(specPath, outPath);
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(
      result.output.includes("store.creative_assets has no product-page header"),
      `missing no-header message\n${result.output}`,
    );
  });
}
