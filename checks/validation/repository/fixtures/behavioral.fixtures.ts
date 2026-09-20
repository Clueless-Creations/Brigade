import { type Harness } from "./_harness.js";

/**
 * Behavioral eval harness fixtures: only the deterministic surfaces are
 * exercised here (subset discovery, the credential gate, and Message Batches
 * request shaping / custom_id mapping via the credential-free self-test).
 * Live agent / live Batches runs stay in the manually-triggered
 * behavioral-evals workflow, never in the PR-gating pipeline.
 * Fixture green ≠ live batch proof.
 */
export function register(h: Harness): void {
  const { runScriptArgs } = h;

  runScriptArgs("behavioral subset discovery lists the flagship scenarios", "run-behavioral-evals.ts", ["--list"], 0, "stale-installed-skill-runtime");
  // Doubles as a spend guard: with no credentials the run must exit before the
  // SDK can resolve a local `ant auth login` profile and bill a live pass.
  runScriptArgs("behavioral run without credentials fails loudly", "run-behavioral-evals.ts", [], 1, "ANTHROPIC_API_KEY is required", {
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_AUTH_TOKEN: "",
  });
  // Message Batches shaping + custom_id join (in-memory fake API; no spend).
  runScriptArgs("message-batches selftest: custom_id mapping, two-stage batches, item failure, resume", "message-batches.selftest.ts", [], 0, "ALL_PASSED");
}
