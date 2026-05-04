import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "dist", "cli.js");
const templatesDir = path.join(root, "templates");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as {
  version: string;
  bin: Record<string, string>;
};

const expectedTemplates = [
  ".cursor/rules/agentkit.md",
  ".github/copilot-instructions.md",
  ".github/pull_request_template.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CODE-QUALITY.md",
  "DESIGN-SYSTEM.md",
  "IMPLEMENTATION-BRIEF-TEMPLATE.md",
  "PRD-TEMPLATE.md",
  "WORKFLOWS.md",
];

function run(args: string[], options: { cwd?: string } = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd || root,
    encoding: "utf8",
  });
}

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "agentkit-test-"));
}

describe("agentkit CLI", () => {
  beforeAll(() => {
    const result = spawnSync("npm", ["run", "build"], {
      cwd: root,
      encoding: "utf8",
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  test("package bin points to the built CLI", () => {
    expect(packageJson.bin.agentkit).toBe("./dist/cli.js");
  });

  test("--help exits successfully and includes usage", () => {
    const result = run(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage:/);
    expect(result.stdout).toMatch(/agentkit init/);
  });

  test("--version prints package version", () => {
    const result = run(["--version"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageJson.version);
  });

  test("--list prints bundled template paths", () => {
    const result = run(["--list"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split("\n")).toEqual(expectedTemplates);
  });

  test("required templates exist", () => {
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(templatesDir, file)), file).toBe(true);
    }
  });

  test("init creates expected files recursively", () => {
    const target = tempDir();
    const result = run(["init", target]);

    expect(result.status).toBe(0);
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(target, file)), file).toBe(true);
    }
  });

  test("init defaults to current working directory", () => {
    const target = tempDir();
    const result = run(["init"], { cwd: target });

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(target, "AGENTS.md"))).toBe(true);
  });

  test("init skips existing files by default", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "custom content\n");

    const result = run(["init", target]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).toBe("custom content\n");
    expect(result.stdout).toMatch(/Skipped existing: AGENTS\.md/);
  });

  test("init --force overwrites existing files", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "custom content\n");

    const result = run(["init", target, "--force"]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).not.toBe("custom content\n");
  });

  test("init --dry-run writes nothing", () => {
    const target = path.join(tempDir(), "nested-target");
    const result = run(["init", target, "--dry-run"]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
    expect(result.stdout).toMatch(/Would install/);
  });

  test("invalid command exits non-zero", () => {
    const result = run(["nope"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/unknown command/i);
  });

  test("invalid option exits non-zero", () => {
    const result = run(["init", "--bad"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/unknown option/i);
  });
});
