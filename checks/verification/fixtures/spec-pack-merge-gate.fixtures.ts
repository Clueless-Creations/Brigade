// Record-mode merge-gate step. Patterns are built in temp git repos so this file
// does not contain a committed record-mode literal.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { assert, skillRoot, type Harness } from "./_harness.js";

const script = path.join(skillRoot, "examples/spec-pack/scripts/check-snapshot-record-mode.sh");
const pack = path.join(skillRoot, "examples/spec-pack");

const recordTrue = ["record", ": ", "true"].join("");
const isRecordingTrue = ["isRecording", " = ", "true"].join("");
const recordAll = ["withSnapshotTesting(record: .", "all"].join("");
const recordMissing = ["withSnapshotTesting(record: .", "missing"].join("");
const envName = ["SNAPSHOT", "_TESTING_RECORD"].join("");

const cleanSwift = ["func testHome() {", "  record: false", "  isRecording = false", "  withSnapshotTesting(record: .never) {", "  }", "}", ""].join("\n");

function sourceFile(pattern: string): string {
  return ["func testHome() {", `  ${pattern}`, "}", ""].join("\n");
}

function scheme(value: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Scheme>",
    "  <EnvironmentVariable",
    `    key = "${envName}"`,
    `    value = "${value}"`,
    '    isEnabled = "YES">',
    "  </EnvironmentVariable>",
    "</Scheme>",
    "",
  ].join("\n");
}

function plan(value: string): string {
  return ["{", '  "environmentVariableEntries" : [', "    {", `      "key" : "${envName}",`, `      "value" : "${value}"`, "    }", "  ]", "}", ""].join("\n");
}

function workflow(value: string): string {
  return ["name: test", "on: push", "env:", `  ${envName}: ${value}`, ""].join("\n");
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

function runCheck(repo: string): { status: number | null; stdout: string } {
  const result = spawnSync("sh", [script], { cwd: repo, encoding: "utf8" });
  return { status: result.status, stdout: (result.stdout ?? "").trim() };
}

function assertHit(repo: string, expected: string): void {
  const result = runCheck(repo);
  assert(result.status === 1, `expected exit 1, got ${result.status ?? "null"}\n${result.stdout}`);
  assert(result.stdout === expected, `expected ${expected}\n${result.stdout}`);
}

function assertPass(repo: string): void {
  const result = runCheck(repo);
  assert(result.status === 0, `expected exit 0, got ${result.status ?? "null"}\n${result.stdout}`);
  assert(result.stdout === "", `expected no output\n${result.stdout}`);
}

export function register(harness: Harness): void {
  const failures: Array<{ slug: string; label: string; file: string; body: string; hit: string }> = [
    {
      slug: "record-true",
      label: "record-mode step fails on record true in a tracked Swift test",
      file: "Tests/Bad.swift",
      body: sourceFile(recordTrue),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "is-recording",
      label: "record-mode step fails on isRecording true in a tracked Swift test",
      file: "Tests/Bad.swift",
      body: sourceFile(isRecordingTrue),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "record-all",
      label: "record-mode step fails on withSnapshotTesting record all",
      file: "Tests/Bad.swift",
      body: sourceFile(recordAll),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "record-missing",
      label: "record-mode step fails on withSnapshotTesting record missing",
      file: "Tests/Bad.swift",
      body: sourceFile(recordMissing),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "record-kt",
      label: "record-mode step fails on record true in a non-Swift test source",
      file: "Tests/Bad.kt",
      body: sourceFile(recordTrue),
      hit: "Tests/Bad.kt:2",
    },
    {
      slug: "record-multiline",
      label: "record-mode step follows a multiline boolean setting and reports its label line",
      file: "Tests/Bad.swift",
      body: sourceFile(
        ["assertSnapshot(", "    of: view,", "    record:", "      /* record references only during authoring */", "      true", "  )"].join("\n"),
      ),
      hit: "Tests/Bad.swift:4",
    },
    {
      slug: "is-recording-multiline",
      label: "record-mode step follows a multiline global setting through comments",
      file: "Tests/Bad.swift",
      body: sourceFile(["isRecording", "    /* a nested /* explanation */ remains a comment */", "    =", "    true"].join("\n")),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "record-reordered",
      label: "record-mode step finds a later argument after a nested call",
      file: "Tests/Bad.swift",
      body: sourceFile(["withSnapshotTesting(", `    diffTool: selectTool(\"${recordTrue}\"),`, "    record:", "      .missing", "  ) {}"].join("\n")),
      hit: "Tests/Bad.swift:4",
    },
    {
      slug: "record-failed",
      label: "record-mode step rejects scoped failure recording",
      file: "Tests/Bad.swift",
      body: sourceFile("withSnapshotTesting(record: .failed) {}"),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "record-qualified",
      label: "record-mode step recognizes a qualified scoped recording value",
      file: "Tests/Bad.swift",
      body: sourceFile("withSnapshotTesting(diffTool: nil, record: SnapshotTestingConfiguration.Record.all) {}"),
      hit: "Tests/Bad.swift:2",
    },
    {
      slug: "scheme",
      label: "record-mode step fails when a scheme sets the record env to all",
      file: "App.xcscheme",
      body: scheme("all"),
      hit: "App.xcscheme:4",
    },
    {
      slug: "testplan",
      label: "record-mode step fails when a test plan sets the record env to missing",
      file: "App.xctestplan",
      body: plan("missing"),
      hit: "App.xctestplan:4",
    },
    {
      slug: "workflow",
      label: "record-mode step fails when a workflow sets the record env to all",
      file: ".github/workflows/test.yml",
      body: workflow("all"),
      hit: ".github/workflows/test.yml:4",
    },
    {
      slug: "dotenv-ci",
      label: "record-mode step fails when a CI env file sets the record env to failed",
      file: ".env.ci",
      body: `${envName}=failed\n`,
      hit: ".env.ci:1",
    },
    {
      slug: "ci-env",
      label: "record-mode step fails when ci.env exports the record env as all",
      file: "ci.env",
      body: `export ${envName}=all\n`,
      hit: "ci.env:1",
    },
  ];

  for (const failure of failures) {
    harness.check(failure.label, () => {
      const repo = harness.makeTempDir(failure.slug);
      commitRepo(repo, { "Tests/Clean.swift": cleanSwift, [failure.file]: failure.body });
      assertHit(repo, failure.hit);
    });
  }

  harness.check("record-mode step passes a clean tracked test and the never exception", () => {
    const repo = harness.makeTempDir("never");
    commitRepo(repo, {
      "Tests/Clean.swift": cleanSwift,
      "App.xcscheme": scheme("never"),
      "App.xctestplan": plan("never"),
      ".github/workflows/test.yml": ["name: test", "on: push", "env:", `  # ${envName}=all`, `  ${envName}: "never"`, ""].join("\n"),
      ".env": `${envName}="never"\n`,
      "ci.env": `${envName}=never\n`,
    });
    assertPass(repo);
  });

  harness.check("record-mode step ignores comments and string contents without hiding the following code", () => {
    const repo = harness.makeTempDir("source-literals");
    const swift = [
      `// ${recordTrue}`,
      `/* ${isRecordingTrue}\n /* ${recordAll}) {} */\n */`,
      `let escaped = "quoted \\\"${recordTrue}\\\" text"`,
      `let multiline = """\n${recordAll}) {}\n${isRecordingTrue}\n"""`,
      `let raw = #"quoted "${recordTrue}" text"#`,
      `let rawMultiline = ##"""\n""" ${recordAll}) {}\n"""##`,
      "withSnapshotTesting(diffTool: nil, record: .never) {}",
      "unrelatedConfiguration(record: .all)",
      "let recording = true",
      "let recordEnabled = true",
      "let saved = isRecording == true",
      "",
    ].join("\n");
    commitRepo(repo, {
      "Tests/Clean.swift": swift,
      "Tests/Clean.ts": [`const text = '${recordTrue}';`, `const template = \`\n${isRecordingTrue}\n\`;`, ""].join("\n"),
      "Tests/clean.py": [`# ${recordTrue}`, `text = '''\n${isRecordingTrue}\n'''`, ""].join("\n"),
    });
    assertPass(repo);
    writeRepoFile(repo, "Tests/Clean.swift", swift + sourceFile(recordTrue));
    assertHit(repo, `Tests/Clean.swift:${swift.split("\n").length + 1}`);
  });

  const regexCases = [
    { name: "double-quote", file: "Tests/Literal.ts", source: 'const matcher = /"/;' },
    { name: "single-quote", file: "Tests/Literal.js", source: "const matcher = /'/;" },
    { name: "character-class", file: "Tests/Literal.tsx", source: "const matcher = /[\"'/]/;" },
    { name: "escaped-slash", file: "Tests/Literal.jsx", source: "const matcher = /\\/[\"']/g;" },
    { name: "arrow-expression", file: "Tests/Literal.ts", source: 'const matcher = (() => /"/)();' },
    { name: "control-statement", file: "Tests/Literal.js", source: 'if (ready) /"/.test(value);' },
    { name: "swift-bare", file: "Tests/Literal.swift", source: 'let matcher = /"/;' },
    { name: "swift-extended", file: "Tests/Literal.swift", source: 'let matcher = #/"/#;' },
    { name: "swift-multiline", file: "Tests/Literal.swift", source: 'let matcher = ##/\n  "literal"\n/##;' },
  ];
  for (const regex of regexCases) {
    harness.check(`record-mode step preserves code after a ${regex.name} regex literal`, () => {
      const repo = harness.makeTempDir(`regex-${regex.name}`);
      const swift = regex.file.endsWith(".swift");
      const assertion = (setting: string): string => (swift ? `assertSnapshot(${setting})` : `assertSnapshot({ ${setting} })`);
      commitRepo(repo, { [regex.file]: `${regex.source} ${assertion("record: false")}\n` });
      assertPass(repo);
      writeRepoFile(repo, regex.file, `${regex.source} ${assertion(recordTrue)}\n`);
      assertHit(repo, `${regex.file}:${regex.source.split("\n").length}`);
      writeRepoFile(repo, regex.file, `${regex.source}\n${assertion(recordTrue)}\n`);
      assertHit(repo, `${regex.file}:${regex.source.split("\n").length + 1}`);
    });
  }

  harness.check("record-mode step does not mistake division expressions for regex literals", () => {
    const repo = harness.makeTempDir("division-expressions");
    for (const operand of ["left", "left++", "({})", "{}"]) {
      writeRepoFile(repo, "Tests/Division.ts", `const ratio = ${operand} / assertSnapshot({ ${recordTrue} }) / right;\n`);
      if (operand === "left") commitRepo(repo, {});
      assertHit(repo, "Tests/Division.ts:1");
    }
  });

  harness.check("record-mode step remains standalone when copied into an app merge gate", () => {
    const repo = harness.makeTempDir("standalone");
    commitRepo(repo, { "Tests/Bad.swift": sourceFile("withSnapshotTesting(\n  diffTool: nil,\n  record: .all\n) {}") });
    const copied = path.join(repo, "merge-gate.sh");
    copyFileSync(script, copied);
    const result = spawnSync("sh", [copied], { cwd: repo, encoding: "utf8" });
    assert(result.status === 1, `copied merge gate must fail: ${result.stderr}`);
    assert(result.stdout.trim() === "Tests/Bad.swift:4", `copied merge gate diagnostic: ${result.stdout}`);
  });

  harness.check("record-mode step ignores an untracked file", () => {
    const repo = harness.makeTempDir("untracked");
    commitRepo(repo, { "Tests/Clean.swift": cleanSwift });
    writeRepoFile(repo, "Tests/Untracked.swift", sourceFile(recordTrue));
    assertPass(repo);
  });

  harness.check("record-mode step fails on an unstaged edit to a tracked file", () => {
    const repo = harness.makeTempDir("dirty");
    commitRepo(repo, { "Tests/Clean.swift": cleanSwift });
    writeRepoFile(repo, "Tests/Clean.swift", sourceFile(recordTrue));
    assertHit(repo, "Tests/Clean.swift:2");
  });

  harness.check("spec-pack merge_gate names the record-mode step", () => {
    const spec = readFileSync(path.join(pack, "spec.yaml"), "utf8");
    assert(spec.includes("No snapshot test is in record mode."), "repo.merge_gate line missing");
    assert(spec.includes("snapshot record-mode step"), "scripts/merge-gate.sh purpose does not mention the record-mode step");
    const merge = readFileSync(path.join(pack, "MERGE.md"), "utf8");
    assert(merge.includes("](scripts/check-snapshot-record-mode.sh)"), "MERGE.md does not link to the record-mode script");
    const guide = readFileSync(path.join(skillRoot, "knowledge/engineering/xcodebuildmcp-testing.md"), "utf8");
    assert(
      guide.includes("Record snapshot references in a separate commit, never together with the gate."),
      "xcodebuildmcp-testing.md is missing the separate-commit line",
    );
  });
}
