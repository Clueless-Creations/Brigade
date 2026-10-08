// CLU-105 accounts, privacy, and legal-preflight cases.
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import YAML from "yaml";
import { assert, skillRoot, type Harness } from "./_harness.js";

const exampleDir = path.join(skillRoot, "examples/spec-pack");
const buildScript = path.join(exampleDir, "build.mjs");

const THIRD_PARTY_ERROR = "accounts: third-party login requires Sign in with Apple or an equivalent private login (Guideline 4.8)";
const DELETE_WEB_ERROR = 'accounts: web surface "delete" is required when accounts is not none';
const DELETE_SCREEN_ERROR = "accounts: in_app_delete_screen is required when accounts is not none";

type SpecDoc = {
  screens: Array<{
    id: string;
    mock?: Record<string, Array<Record<string, unknown>>>;
    [key: string]: unknown;
  }>;
  web: Array<{ id: string }>;
  accounts?: Record<string, unknown>;
  legal_preflight?: Array<Record<string, unknown>>;
};

function runBuild(specPath: string, outPath: string): { status: number | null; output: string; html: string } {
  const result = spawnSync(process.execPath, [buildScript, specPath, outPath], {
    cwd: exampleDir,
    encoding: "utf8",
  });
  let html = "";
  try {
    html = readFileSync(outPath, "utf8");
  } catch {
    html = "";
  }
  return { status: result.status, output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`, html };
}

function loadExample(): SpecDoc {
  return YAML.parse(readFileSync(path.join(exampleDir, "spec.yaml"), "utf8")) as SpecDoc;
}

function withSpec(harness: Harness, name: string, edit: (spec: SpecDoc) => void): { status: number | null; output: string; html: string } {
  const work = harness.makeTempDir(name);
  const specPath = path.join(work, "spec.yaml");
  const spec = loadExample();
  edit(spec);
  writeFileSync(specPath, YAML.stringify(spec));
  return runBuild(specPath, path.join(work, "index.html"));
}

function addDeleteScreen(spec: SpecDoc): void {
  const settings = spec.screens.find((screen) => screen.id === "settings");
  assert(settings !== undefined, "example spec must include settings");
  const blocks = settings.mock?.default ?? [];
  blocks.push({ type: "button", text: "Delete account", to: "delete-account" });
  settings.mock = { ...(settings.mock ?? {}), default: blocks };
  spec.screens.push({
    id: "delete-account",
    states: ["default"],
    not_applicable: {
      loading: "Account deletion is one action.",
      empty: "Account deletion is one action.",
      error: "The screen shows the result inline.",
    },
    mock: { default: [{ type: "title", text: "Delete account" }] },
    acceptance: ["Deletes the account in the app."],
    events: [],
  });
}

function withAccounts(spec: SpecDoc, accounts: Record<string, unknown>, options?: { deleteScreen?: boolean }): void {
  if (options?.deleteScreen !== false) addDeleteScreen(spec);
  spec.accounts = { in_app_delete_screen: "delete-account", ...accounts };
}

export function register(harness: Harness): void {
  harness.check("spec-pack accounts none passes and the page maps privacy labels beside the privacy page", () => {
    const outDir = harness.makeTempDir("spec-pack-accounts-none");
    const outPath = path.join(outDir, "index.html");
    copyFileSync(path.join(exampleDir, "spec.yaml"), path.join(outDir, "spec.yaml"));
    const result = runBuild(path.join(exampleDir, "spec.yaml"), outPath);
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
    assert(result.output.includes("0 errors"), `expected a clean example\n${result.output}`);
    assert(result.html.includes('id: "legal-preflight"'), "preflight section was not injected");
    assert(result.html.includes("Privacy label map"), "privacy label map was not injected");
    assert(result.html.includes('document.getElementById("w-privacy")'), "label map is not attached to the privacy page");
    assert(result.html.includes("PostHog") && result.html.includes("RevenueCat") && result.html.includes("Sentry"), "example inventory is missing a processor");
    assert(result.html.includes('"id": "coppa"') || result.html.includes("id: coppa"), "legal preflight items were not rendered into the page");
  });

  harness.check("spec-pack optional Google login without Apple or an equivalent fails Guideline 4.8", () => {
    const result = withSpec(harness, "spec-pack-accounts-google", (spec) => {
      withAccounts(spec, {
        mode: "optional",
        providers: [{ id: "google", third_party: true }],
        sign_in_with_apple: false,
      });
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes(THIRD_PARTY_ERROR), `missing Guideline 4.8 error\n${result.output}`);
  });

  harness.check("spec-pack equivalent private login fails when a Guideline 4.8 feature is missing", () => {
    const result = withSpec(harness, "spec-pack-accounts-equivalent-partial", (spec) => {
      withAccounts(spec, {
        mode: "optional",
        providers: ["google"],
        sign_in_with_apple: false,
        equivalent_private_login: {
          limits_data_to_name_and_email: true,
          private_email: true,
          no_advertising_without_consent: false,
        },
      });
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes(THIRD_PARTY_ERROR), `missing Guideline 4.8 error\n${result.output}`);
  });

  harness.check("spec-pack optional Google login passes with Sign in with Apple and an in-app delete screen", () => {
    const result = withSpec(harness, "spec-pack-accounts-apple", (spec) => {
      withAccounts(spec, {
        mode: "optional",
        providers: [{ id: "google", third_party: true }],
        sign_in_with_apple: true,
      });
    });
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
  });

  harness.check("spec-pack optional Google login passes with a qualifying equivalent private login", () => {
    const result = withSpec(harness, "spec-pack-accounts-equivalent", (spec) => {
      withAccounts(spec, {
        mode: "optional",
        providers: ["google"],
        sign_in_with_apple: false,
        equivalent_private_login: {
          limits_data_to_name_and_email: true,
          private_email: true,
          no_advertising_without_consent: true,
        },
      });
    });
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
  });

  harness.check("spec-pack own-account login does not require Sign in with Apple", () => {
    const result = withSpec(harness, "spec-pack-accounts-email", (spec) => {
      withAccounts(spec, {
        mode: "required",
        providers: ["email"],
        sign_in_with_apple: false,
      });
    });
    assert(result.status === 0, `expected exit 0, got ${result.status}\n${result.output}`);
  });

  harness.check("spec-pack accounts other than none fail without the delete web surface", () => {
    const result = withSpec(harness, "spec-pack-accounts-no-web-delete", (spec) => {
      withAccounts(spec, { mode: "optional", providers: ["email"], sign_in_with_apple: true });
      spec.web = spec.web.filter((page) => page.id !== "delete");
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes(DELETE_WEB_ERROR), `missing delete-surface error\n${result.output}`);
  });

  harness.check("spec-pack accounts other than none fail without an in-app delete screen", () => {
    const result = withSpec(harness, "spec-pack-accounts-no-screen", (spec) => {
      withAccounts(spec, { mode: "optional", providers: ["email"], sign_in_with_apple: true }, { deleteScreen: false });
      if (spec.accounts) delete spec.accounts.in_app_delete_screen;
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes(DELETE_SCREEN_ERROR), `missing in-app delete error\n${result.output}`);
  });

  harness.check("spec-pack accounts in_app_delete_screen must name a real screen", () => {
    const result = withSpec(harness, "spec-pack-accounts-bad-screen", (spec) => {
      spec.accounts = { mode: "optional", providers: ["email"], sign_in_with_apple: true, in_app_delete_screen: "ghost-delete" };
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes('accounts: in_app_delete_screen "ghost-delete" is not a screen'), `missing unknown-screen error\n${result.output}`);
  });

  harness.check("spec-pack legal_preflight is required", () => {
    const result = withSpec(harness, "spec-pack-legal-missing", (spec) => {
      delete spec.legal_preflight;
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes("legal_preflight: block is missing"), `missing block error\n${result.output}`);
  });

  harness.check("spec-pack legal_preflight fails when an item is missing", () => {
    const result = withSpec(harness, "spec-pack-legal-item", (spec) => {
      spec.legal_preflight = (spec.legal_preflight ?? []).filter((item) => item.id !== "coppa");
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes('legal_preflight: "coppa" is missing'), `missing item error\n${result.output}`);
  });

  harness.check("spec-pack legal_preflight n/a requires a reason", () => {
    const result = withSpec(harness, "spec-pack-legal-na", (spec) => {
      const item = (spec.legal_preflight ?? []).find((entry) => entry.id === "auto_renew");
      assert(item !== undefined, "example must include auto_renew");
      delete item.reason;
    });
    assert(result.status === 1, `expected exit 1, got ${result.status}\n${result.output}`);
    assert(result.output.includes('legal_preflight: "auto_renew" status "n/a" needs a reason'), `missing n/a reason error\n${result.output}`);
  });

  harness.check("spec-pack legal_preflight human-only items require steps", () => {
    const dmca = withSpec(harness, "spec-pack-legal-dmca", (spec) => {
      const item = (spec.legal_preflight ?? []).find((entry) => entry.id === "dmca");
      assert(item !== undefined, "example must include dmca");
      item.status = "pass";
      delete item.human_steps;
    });
    assert(dmca.status === 1, `expected exit 1, got ${dmca.status}\n${dmca.output}`);
    assert(dmca.output.includes('legal_preflight: "dmca" needs human_steps'), `missing DMCA steps error\n${dmca.output}`);

    const email = withSpec(harness, "spec-pack-legal-email", (spec) => {
      const item = (spec.legal_preflight ?? []).find((entry) => entry.id === "can_spam");
      assert(item !== undefined, "example must include can_spam");
      item.status = "founder_fact_needed";
      delete item.human_steps;
    });
    assert(email.status === 1, `expected exit 1, got ${email.status}\n${email.output}`);
    assert(email.output.includes('legal_preflight: "can_spam" needs human_steps'), `missing email steps error\n${email.output}`);
  });
}
