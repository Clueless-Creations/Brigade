import { inspectWorkspaceEntrypoints } from "../../adapters/workspace-entrypoints.js";

/** Guidance health is advisory. It cannot change work eligibility or authorize a write. */
export function workspaceEntrypointWarnings(workspace: string, workspaceId: string): string[] {
  try {
    const report = inspectWorkspaceEntrypoints({ target: workspace });
    if (report.status === "current") return [];
    const files = report.files
      .filter((file) => file.status !== "current")
      .map((file) => `${file.file}: ${file.status}`)
      .join(", ");
    const command = `b2c refresh-entrypoints --workspace ${workspaceId}`;
    if (report.status === "modified" || report.status === "unsafe") {
      return [
        `workspace.entrypoints_conflict: ${files}. Inspect ${command} --json and reconcile the affected guide while preserving app instructions. Status and plan do not change files.`,
      ];
    }
    return [
      `workspace.entrypoints_refresh: ${files}. Preview ${command} --json; use --apply for an authorized guidance refresh. This does not initialize a runtime or change its pins.`,
    ];
  } catch {
    return [
      "workspace.entrypoints_unavailable: Startup guidance could not be inspected. Check the workspace and installed Brigade templates; business status is not proof that an agent loaded its guide.",
    ];
  }
}
