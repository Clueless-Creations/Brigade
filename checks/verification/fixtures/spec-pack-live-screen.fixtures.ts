// Live-screen merge gate. Patterns live in temp git repos so the template stays clean.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { assert, skillRoot, type Harness } from "./_harness.js";

const pack = path.join(skillRoot, "examples/spec-pack");
const liveScript = path.join(pack, "scripts/check-live-screen-test.sh");
const mockScript = path.join(pack, "scripts/check-mock-state-branches.sh");
const scriptsDir = path.join(pack, "scripts");

const lengthView = [
  "import 'package:flutter/widgets.dart';",
  "",
  "class ScanScreen extends StatelessWidget {",
  "  const ScanScreen({super.key, required this.name});",
  "  final String name;",
  "  @override",
  "  Widget build(BuildContext context) {",
  "    if (name.length > 36) {",
  "      return const SizedBox.shrink();",
  "    }",
  "    return Text(name);",
  "  }",
  "}",
  "",
].join("\n");

const cleanView = [
  "import 'package:flutter/widgets.dart';",
  "",
  "class ScanScreen extends StatelessWidget {",
  "  const ScanScreen({super.key, required this.name});",
  "  final String name;",
  "  @override",
  "  Widget build(BuildContext context) {",
  "    return Text(name);",
  "  }",
  "}",
  "",
].join("\n");

const commentedView = [
  "import 'package:flutter/widgets.dart';",
  "",
  "class ScanScreen extends StatelessWidget {",
  "  const ScanScreen({super.key, required this.name});",
  "  final String name;",
  "  @override",
  "  Widget build(BuildContext context) {",
  "    // name.length > 36 is a mock-state branch, not a shipping layout.",
  "    return Text(name);",
  "  }",
  "}",
  "",
].join("\n");

const shortThresholdView = [
  "import 'package:flutter/widgets.dart';",
  "",
  "class ScanScreen extends StatelessWidget {",
  "  const ScanScreen({super.key, required this.name});",
  "  final String name;",
  "  @override",
  "  Widget build(BuildContext context) {",
  "    if (name.length > 0) {",
  "      return Text(name);",
  "    }",
  "    return const SizedBox.shrink();",
  "  }",
  "}",
  "",
].join("\n");

const modelRule = ["bool tooLong(String name) {", "  return name.length > 36;", "}", ""].join("\n");

const flagFile = ["class Flags {", "  final bool gateOnly = true;", "}", ""].join("\n");

const flagTest = ["class Flags {", "  final bool gateOnly = true;", "  bool hide(String name) => name.length > 36;", "}", ""].join("\n");

const swiftLength = [
  "import SwiftUI",
  "struct ScanScreen: View {",
  "  var name: String",
  "  var body: some View {",
  "    Text(name.count > 36 ? \"\" : name)",
  "  }",
  "}",
  "",
].join("\n");

const otherView = [
  "import 'package:flutter/widgets.dart';",
  "",
  "class OtherScreen extends StatelessWidget {",
  "  const OtherScreen({super.key});",
  "  @override",
  "  Widget build(BuildContext context) => const Text('other');",
  "}",
  "",
].join("\n");

const missingTokenTest = [
  "const brigadeLiveScreenTest = 'brigade-live-screen-test';",
  "void pumpLiveScreen() {}",
  "void fakedAtBoundary() {}",
  "const longName = 'long';",
  "const landscape = 1;",
  "const noOverlap = 'noOverlap';",
  "const noOverflow = 'noOverflow';",
  "const reachableAction = 'reachableAction';",
  "void expectNoOverlap() {}",
  "void expectNoOverflow() {}",
  "void expectReachableAction() {}",
  "void main() {",
  "  pumpLiveScreen();",
  "  ShippingScreen();",
  "  primaryInteraction: 'captureCount';",
  "}",
  "",
].join("\n");

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

function commitAll(repo: string, message: string): void {
  git(repo, ["add", "-A"]);
  git(repo, ["commit", "--no-verify", "-m", message]);
}

function initMain(repo: string, files: Record<string, string>): void {
  git(repo, ["init", "-b", "main"]);
  for (const [rel, body] of Object.entries(files)) writeRepoFile(repo, rel, body);
  commitAll(repo, "base");
}

function runScript(script: string, repo: string): { status: number | null; stdout: string } {
  const result = spawnSync("sh", [script], { cwd: repo, encoding: "utf8" });
  return { status: result.status, stdout: (result.stdout ?? "").trim() };
}

function copyTemplates(repo: string, flavour: "flutter" | "swiftui"): void {
  const source = path.join(pack, "templates/live-screen", flavour);
  const target = path.join(repo, "templates/live-screen", flavour);
  mkdirSync(target, { recursive: true });
  if (flavour === "flutter") {
    copyFileSync(path.join(source, "shipping_view.dart"), path.join(target, "shipping_view.dart"));
    copyFileSync(path.join(source, "live_screen_test.dart"), path.join(target, "live_screen_test.dart"));
    return;
  }
  copyFileSync(path.join(source, "ShippingView.swift"), path.join(target, "ShippingView.swift"));
  copyFileSync(path.join(source, "LiveScreenTests.swift"), path.join(target, "LiveScreenTests.swift"));
}

function installGate(repo: string): void {
  const target = path.join(repo, "scripts");
  mkdirSync(target, { recursive: true });
  for (const name of ["merge-gate.sh", "check-snapshot-record-mode.sh", "check-live-screen-test.sh", "check-mock-state-branches.sh"]) {
    copyFileSync(path.join(scriptsDir, name), path.join(target, name));
  }
}

export function register(harness: Harness): void {
  harness.check("mock-state step fails when a view hides itself on a long name", () => {
    const repo = harness.makeTempDir("mock-length-fail");
    initMain(repo, { "lib/scan_screen.dart": lengthView });
    const result = runScript(mockScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "lib/scan_screen.dart:8:length-threshold", result.stdout);
  });

  harness.check("mock-state step passes after the length branch leaves the view", () => {
    const repo = harness.makeTempDir("mock-length-pass");
    initMain(repo, {
      "lib/scan_screen.dart": cleanView,
      "lib/name_rule.dart": modelRule,
      "lib/commented_screen.dart": commentedView,
      "lib/short_screen.dart": shortThresholdView,
      "test/flags_test.dart": flagTest,
    });
    const result = runScript(mockScript, repo);
    assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "", result.stdout);
  });

  harness.check("mock-state step fails on a gate-only flag in production code", () => {
    const repo = harness.makeTempDir("mock-flag-fail");
    initMain(repo, { "lib/flags.dart": flagFile });
    const result = runScript(mockScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "lib/flags.dart:2:fixture-flag", result.stdout);
  });

  harness.check("mock-state step fails when a SwiftUI view branches on name count", () => {
    const repo = harness.makeTempDir("mock-swift-fail");
    initMain(repo, { "Sources/ScanScreen.swift": swiftLength });
    const result = runScript(mockScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "Sources/ScanScreen.swift:5:length-threshold", result.stdout);
  });

  harness.check("mock-state step passes on the shipped Flutter and SwiftUI harness views", () => {
    const repo = harness.makeTempDir("mock-templates-pass");
    initMain(repo, { "README.md": "base\n" });
    copyTemplates(repo, "flutter");
    copyTemplates(repo, "swiftui");
    commitAll(repo, "harness");
    const result = runScript(mockScript, repo);
    assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "", result.stdout);
  });

  harness.check("mock-state step fails when the shipped view grows a length branch", () => {
    const repo = harness.makeTempDir("mock-templates-fail");
    initMain(repo, { "README.md": "base\n" });
    copyTemplates(repo, "flutter");
    const viewPath = "templates/live-screen/flutter/shipping_view.dart";
    const body = readFileSync(path.join(repo, viewPath), "utf8").replace(
      "return Column(",
      "if (title.length > 36) return const SizedBox.shrink();\n    return Column(",
    );
    writeRepoFile(repo, viewPath, body);
    commitAll(repo, "bad view");
    const result = runScript(mockScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout.includes("templates/live-screen/flutter/shipping_view.dart:"), result.stdout);
    assert(result.stdout.includes(":length-threshold"), result.stdout);
  });

  harness.check("live-screen step fails when a screen change has no live-screen test", () => {
    const repo = harness.makeTempDir("live-missing");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    writeRepoFile(repo, "lib/scan_screen.dart", cleanView);
    commitAll(repo, "screen");
    const result = runScript(liveScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "live-screen: missing test for lib/scan_screen.dart", result.stdout);
  });

  harness.check("live-screen step ignores an untracked test file", () => {
    const repo = harness.makeTempDir("live-untracked");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    writeRepoFile(repo, "lib/scan_screen.dart", cleanView);
    commitAll(repo, "screen");
    copyTemplates(repo, "flutter");
    const result = runScript(liveScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "live-screen: missing test for lib/scan_screen.dart", result.stdout);
  });

  harness.check("live-screen step fails when the test omits a contract token", () => {
    const repo = harness.makeTempDir("live-token");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    writeRepoFile(repo, "templates/live-screen/flutter/shipping_view.dart", readFileSync(path.join(pack, "templates/live-screen/flutter/shipping_view.dart"), "utf8"));
    writeRepoFile(repo, "test/live_screen_test.dart", missingTokenTest);
    commitAll(repo, "screen");
    const result = runScript(liveScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "live-screen: test/live_screen_test.dart missing textScale2x", result.stdout);
  });

  harness.check("live-screen step fails when the test does not pump the changed view", () => {
    const repo = harness.makeTempDir("live-name");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    writeRepoFile(repo, "lib/other_screen.dart", otherView);
    copyTemplates(repo, "flutter");
    commitAll(repo, "screen");
    const result = runScript(liveScript, repo);
    assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "live-screen: OtherScreen is not pumped by a live-screen test", result.stdout);
  });

  harness.check("live-screen step passes when the Flutter harness is in the screen diff", () => {
    const repo = harness.makeTempDir("live-flutter-pass");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    copyTemplates(repo, "flutter");
    commitAll(repo, "screen");
    const result = runScript(liveScript, repo);
    assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "", result.stdout);
  });

  harness.check("live-screen step passes when the SwiftUI harness is in the screen diff", () => {
    const repo = harness.makeTempDir("live-swift-pass");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "screen"]);
    copyTemplates(repo, "swiftui");
    commitAll(repo, "screen");
    const result = runScript(liveScript, repo);
    assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "", result.stdout);
  });

  harness.check("live-screen step passes when the diff does not change a shipping view", () => {
    const repo = harness.makeTempDir("live-readme");
    initMain(repo, { "README.md": "base\n" });
    git(repo, ["checkout", "-b", "docs"]);
    writeRepoFile(repo, "README.md", "base\nnote\n");
    commitAll(repo, "docs");
    const result = runScript(liveScript, repo);
    assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
    assert(result.stdout === "", result.stdout);
  });

  harness.check("merge gate fails on a mock-state branch and passes on the harness diff", () => {
    const broken = harness.makeTempDir("gate-fail");
    initMain(broken, { "lib/scan_screen.dart": lengthView });
    installGate(broken);
    commitAll(broken, "gate");
    const failed = runScript(path.join(broken, "scripts/merge-gate.sh"), broken);
    assert(failed.status === 1, `expected exit 1, got ${failed.status ?? "null"}\n${failed.stdout}`);
    assert(failed.stdout === "lib/scan_screen.dart:8:length-threshold", failed.stdout);

    const ready = harness.makeTempDir("gate-pass");
    initMain(ready, { "README.md": "base\n" });
    installGate(ready);
    commitAll(ready, "gate");
    git(ready, ["checkout", "-b", "screen"]);
    copyTemplates(ready, "flutter");
    copyTemplates(ready, "swiftui");
    commitAll(ready, "screen");
    const passed = runScript(path.join(ready, "scripts/merge-gate.sh"), ready);
    assert(passed.status === 0, `expected exit 0, got ${passed.status ?? "null"}\n${passed.stdout}`);
    assert(passed.stdout === "", passed.stdout);
  });

  harness.check("screen pull request checklist keeps the live-screen and mock-state rules", () => {
    const dir = harness.makeTempDir("live-screen-checklist");
    const built = spawnSync(process.execPath, [path.join(pack, "build.mjs"), path.join(pack, "spec.yaml"), path.join(dir, "index.html")], {
      cwd: pack,
      encoding: "utf8",
    });
    assert(built.status === 0, built.stdout + built.stderr);
    const draft = JSON.parse(readFileSync(path.join(dir, "tracker-draft.json"), "utf8")) as { issues: Array<{ key: string; checklist: string[] }> };
    const home = draft.issues.find((issue) => issue.key === "S-home");
    assert(home !== undefined, "S-home checklist missing");
    assert(
      home.checklist.some((line) => line.includes("live-screen test")),
      "screen checklist dropped the live-screen rule",
    );
    assert(
      home.checklist.some((line) => line.includes("fixture property")),
      "screen checklist dropped the mock-state rule",
    );
    const spec = readFileSync(path.join(pack, "spec.yaml"), "utf8");
    const merge = readFileSync(path.join(pack, "MERGE.md"), "utf8");
    assert(spec.includes("No snapshot test is in record mode."), "record-mode merge rule missing");
    assert(merge.includes("](scripts/check-live-screen-test.sh)"), "MERGE.md does not link the live-screen step");
    assert(merge.includes("](scripts/check-mock-state-branches.sh)"), "MERGE.md does not link the mock-state step");
    const mobile = readFileSync(path.join(skillRoot, "examples/workspace/business/engineering/app-agent-roster/agents/mobile-engineer.md"), "utf8");
    const access = readFileSync(path.join(skillRoot, "examples/workspace/business/engineering/app-agent-roster/agents/accessibility-device-qa.md"), "utf8");
    const leader = readFileSync(path.join(skillRoot, "examples/workspace/business/engineering/app-agent-roster/agents/engineering-leader.md"), "utf8");
    const packDoc = readFileSync(path.join(skillRoot, "knowledge/design/spec-pack.md"), "utf8");
    const lane = readFileSync(path.join(skillRoot, "knowledge/engineering/engineering-orchestration.md"), "utf8");
    assert(mobile.includes("live-screen test"), "mobile engineer prompt missed the live-screen test");
    assert(mobile.includes("gate-only flag"), "mobile engineer prompt missed the mock-state ban");
    assert(access.includes("live-screen test"), "accessibility prompt missed the live-screen test");
    assert(leader.includes("live-screen test"), "engineering leader prompt missed the live-screen test");
    assert(packDoc.includes("A live-screen test pumps the shipping view."), "spec pack guide missed the live-screen test");
    assert(lane.includes("A changed screen ships a live-screen test."), "engineering lane guide missed the live-screen test");
  });
}
