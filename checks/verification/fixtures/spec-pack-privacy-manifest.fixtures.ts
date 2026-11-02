// CLU-186: privacy manifest merge-gate step. Each fixture builds a temp git repo with app
// and widget targets and checks that required-reason API use needs a matching reason.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { assert, skillRoot, type Harness } from "./_harness.js";

const pack = path.join(skillRoot, "examples/spec-pack");
const script = path.join(pack, "scripts/check-privacy-manifest.sh");
const templates = path.join(pack, "templates/privacy-manifest");
const appManifest = readFileSync(path.join(templates, "App/PrivacyInfo.xcprivacy"), "utf8");
const widgetManifest = readFileSync(path.join(templates, "Widget/PrivacyInfo.xcprivacy"), "utf8");

const appStore = ["import Foundation", "", "let defaults = UserDefaults.standard", ""].join("\n");
const widgetStore = ["import WidgetKit", "", 'let shared = UserDefaults(suiteName: "group.example.soon")', ""].join("\n");

function manifest(entries: Record<string, string[]>): string {
  const types = Object.entries(entries)
    .map(([category, reasons]) =>
      [
        "    <dict>",
        "      <key>NSPrivacyAccessedAPIType</key>",
        `      <string>${category}</string>`,
        "      <key>NSPrivacyAccessedAPITypeReasons</key>",
        "      <array>",
        ...reasons.map((reason) => `        <string>${reason}</string>`),
        "      </array>",
        "    </dict>",
      ].join("\n"),
    )
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<plist version=\"1.0\">",
    "<dict>",
    "  <key>NSPrivacyAccessedAPITypes</key>",
    "  <array>",
    types,
    "  </array>",
    "</dict>",
    "</plist>",
    "",
  ].join("\n");
}

function git(cwd: string, args: string[]): void {
  const result = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    encoding: "utf8",
  });
  assert(result.status === 0, `git ${args.join(" ")} failed (${result.status ?? "null"})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
}

function writeRepoFile(repo: string, rel: string, body: string): void {
  const target = path.join(repo, rel);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, body);
}

function commitRepo(repo: string, files: Record<string, string>): void {
  git(repo, ["init", "-b", "main"]);
  for (const [rel, body] of Object.entries(files)) writeRepoFile(repo, rel, body);
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "--no-verify", "-m", "fixture"]);
}

function runCheck(repo: string, gate = script): { status: number | null; stdout: string } {
  const result = spawnSync("sh", [gate], { cwd: repo, encoding: "utf8" });
  return { status: result.status, stdout: (result.stdout ?? "").trim() };
}

function assertHit(repo: string, expected: string[]): void {
  const result = runCheck(repo);
  assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
  assert(result.stdout === expected.join("\n"), `expected\n${expected.join("\n")}\ngot\n${result.stdout}`);
}

function assertPass(repo: string): void {
  const result = runCheck(repo);
  assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
  assert(result.stdout === "", `expected no output\n${result.stdout}`);
}

export function register(harness: Harness): void {
  harness.check("privacy manifest step passes the app and widget templates for UserDefaults and App Group defaults", () => {
    const repo = harness.makeTempDir("privacy-templates");
    commitRepo(repo, {
      "App/Store.swift": appStore,
      "App/PrivacyInfo.xcprivacy": appManifest,
      "Widget/Shared.swift": widgetStore,
      "Widget/PrivacyInfo.xcprivacy": widgetManifest,
    });
    assertPass(repo);
  });

  harness.check("privacy manifest step fails when a target that uses UserDefaults has no manifest", () => {
    const repo = harness.makeTempDir("privacy-missing");
    commitRepo(repo, {
      "App/Store.swift": appStore,
      "App/PrivacyInfo.xcprivacy": appManifest,
      "Widget/Shared.swift": widgetStore,
    });
    assertHit(repo, ["Widget/Shared.swift:3: NSPrivacyAccessedAPICategoryUserDefaults needs PrivacyInfo.xcprivacy in this target"]);
  });

  harness.check("privacy manifest step fails when App Group defaults have no 1C8F.1 reason", () => {
    const repo = harness.makeTempDir("privacy-app-group");
    commitRepo(repo, {
      "Widget/Shared.swift": widgetStore,
      "Widget/PrivacyInfo.xcprivacy": manifest({ NSPrivacyAccessedAPICategoryUserDefaults: ["CA92.1"] }),
    });
    assertHit(repo, ["Widget/Shared.swift:3: NSPrivacyAccessedAPICategoryUserDefaults needs reason 1C8F.1 in Widget/PrivacyInfo.xcprivacy"]);
  });

  harness.check("privacy manifest step fails when a category is used without a reason", () => {
    const repo = harness.makeTempDir("privacy-category");
    commitRepo(repo, {
      "App/Store.swift": appStore,
      "App/Clock.swift": ["import Foundation", "let up = ProcessInfo.processInfo.systemUptime", ""].join("\n"),
      "App/Files.swift": ["import Foundation", "let attrs = try FileManager.default.attributesOfItem(atPath: p)", "let made = attrs[.creationDate]", ""].join("\n"),
      "App/Disk.swift": ["let keys: Set<URLResourceKey> = [.volumeAvailableCapacityForImportantUsageKey]", ""].join("\n"),
      "App/Keys.swift": ["let modes = UITextInputMode.activeInputModes", ""].join("\n"),
      "App/PrivacyInfo.xcprivacy": appManifest,
    });
    assertHit(repo, [
      "App/Clock.swift:2: NSPrivacyAccessedAPICategorySystemBootTime has no reason in App/PrivacyInfo.xcprivacy",
      "App/Disk.swift:1: NSPrivacyAccessedAPICategoryDiskSpace has no reason in App/PrivacyInfo.xcprivacy",
      "App/Files.swift:3: NSPrivacyAccessedAPICategoryFileTimestamp has no reason in App/PrivacyInfo.xcprivacy",
      "App/Keys.swift:1: NSPrivacyAccessedAPICategoryActiveKeyboards has no reason in App/PrivacyInfo.xcprivacy",
    ]);
  });

  harness.check("privacy manifest step uses the nearest manifest in a parent folder", () => {
    const repo = harness.makeTempDir("privacy-nearest");
    commitRepo(repo, {
      "App/Features/Settings/Store.swift": appStore,
      "App/PrivacyInfo.xcprivacy": manifest({ NSPrivacyAccessedAPICategoryUserDefaults: ["CA92.1"] }),
      "PrivacyInfo.xcprivacy": manifest({ NSPrivacyAccessedAPICategoryDiskSpace: ["E174.1"] }),
    });
    assertPass(repo);
  });

  harness.check("privacy manifest step ignores comments, tests, vendored SDKs, and untracked files", () => {
    const repo = harness.makeTempDir("privacy-ignored");
    commitRepo(repo, {
      "App/Notes.swift": ["// UserDefaults is not used here.", "/* systemUptime */", "let x = 1 // UserDefaults", ""].join("\n"),
      "AppTests/StoreTests.swift": appStore,
      "Pods/SDK/Store.swift": appStore,
    });
    writeRepoFile(repo, "App/Untracked.swift", appStore);
    assertPass(repo);
  });

  harness.check("privacy manifest step fails on an unstaged edit to a tracked file", () => {
    const repo = harness.makeTempDir("privacy-dirty");
    commitRepo(repo, { "App/Store.swift": "let x = 1\n" });
    writeRepoFile(repo, "App/Store.swift", appStore);
    assertHit(repo, ["App/Store.swift:3: NSPrivacyAccessedAPICategoryUserDefaults needs PrivacyInfo.xcprivacy in this target"]);
  });

  harness.check("privacy manifest step remains standalone when copied into an app repo", () => {
    const repo = harness.makeTempDir("privacy-standalone");
    commitRepo(repo, { "App/Store.swift": appStore });
    const copied = path.join(repo, "check.sh");
    copyFileSync(script, copied);
    const result = runCheck(repo, copied);
    assert(result.status === 1, `copied step must fail: ${result.stdout}`);
  });

  harness.check("spec-pack merge gate, spec, and store checklist name the privacy manifest", () => {
    const gate = readFileSync(path.join(pack, "scripts/merge-gate.sh"), "utf8");
    assert(gate.includes('sh "$dir/check-privacy-manifest.sh"'), "scripts/merge-gate.sh does not run the privacy manifest step");
    const spec = readFileSync(path.join(pack, "spec.yaml"), "utf8");
    assert(spec.includes("matching reason in that target's PrivacyInfo.xcprivacy"), "repo.merge_gate line missing");
    assert(spec.includes("path: templates/privacy-manifest/"), "repo.files does not list the privacy manifest templates");
    assert(spec.includes("reason: 1C8F.1"), "privacy.required_reason_apis does not list the App Group reason");
    const merge = readFileSync(path.join(pack, "MERGE.md"), "utf8");
    assert(merge.includes("](scripts/check-privacy-manifest.sh)"), "MERGE.md does not link to the privacy manifest script");
    const checklist = readFileSync(path.join(skillRoot, "examples/workspace/business/store/APPLE_APP_STORE_REQUIREMENTS.md"), "utf8");
    for (const phrase of ["Each widget or extension target has its own valid `PrivacyInfo.xcprivacy`.", "SDK App Privacy Label Mapping", "| PostHog |", "| Sentry |", "| RevenueCat |", "dSYM upload owner"]) {
      assert(checklist.includes(phrase), `APPLE_APP_STORE_REQUIREMENTS.md is missing ${phrase}`);
    }
  });
}
