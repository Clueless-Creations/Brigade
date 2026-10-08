import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type RenderedFile = string | Uint8Array;

/** Render twice into temp directories and require the bytes to match. */
export function unstableRenderMessage(label: string, render: () => Record<string, RenderedFile>): string | undefined {
  const left = render();
  const right = render();
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.join("\n") !== rightKeys.join("\n")) {
    return `${label} changed its file list between two renders.`;
  }
  const root = mkdtempSync(path.join(tmpdir(), "b2c-stamp-"));
  try {
    const leftDir = path.join(root, "a");
    const rightDir = path.join(root, "b");
    writeTree(leftDir, left);
    writeTree(rightDir, right);
    for (const key of leftKeys) {
      const a = left[key]!;
      const b = right[key]!;
      if (Buffer.from(a).equals(Buffer.from(b))) continue;
      return `${label} is not byte-stable: ${key}`;
    }
    return undefined;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeTree(dir: string, files: Record<string, RenderedFile>): void {
  for (const [relative, bytes] of Object.entries(files)) {
    const target = path.join(dir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
}
