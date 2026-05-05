import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import {
  getFilesForAiTools,
  getFilesForTemplateSet,
  getSelectedTemplateFiles,
  resolveProjectPreset,
} from "../src/cli.js";

const root = path.resolve(import.meta.dirname, "..");
const cli = path.join(root, "dist", "cli.js");
const templatesDir = path.join(root, "templates");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
) as {
  name: string;
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
    expect(packageJson.name).toBe("thomas-agentkit");
    expect(packageJson.bin.agentkit).toBe("./dist/cli.js");
  });

  test("--help exits successfully and includes usage", () => {
    const result = run(["--help"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage:/);
    expect(result.stdout).toMatch(/agentkit init/);
    expect(result.stdout).toMatch(/agentkit update/);
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

  test("--list-presets prints available preset names", () => {
    const result = run(["--list-presets"]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim().split("\n")).toEqual([
      "next",
      "sveltekit",
      "express",
      "convex",
      "fullstack",
    ]);
  });

  test("required templates exist", () => {
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(templatesDir, file)), file).toBe(true);
    }
  });

  test("maps project types to presets", () => {
    expect(resolveProjectPreset("generic")).toBeUndefined();
    expect(resolveProjectPreset("next")).toBe("next");
    expect(resolveProjectPreset("sveltekit")).toBe("sveltekit");
    expect(resolveProjectPreset("express")).toBe("express");
    expect(resolveProjectPreset("convex")).toBe("convex");
    expect(resolveProjectPreset("fullstack")).toBe("fullstack");
  });

  test("maps AI tool selections to tool-specific files", () => {
    expect(getFilesForAiTools(["codex", "cursor", "claude", "copilot"])).toEqual([
      ".cursor/rules/agentkit.md",
      ".github/copilot-instructions.md",
      "AGENTS.md",
      "CLAUDE.md",
    ]);
  });

  test("maps template sets to bundled files", () => {
    expect(getFilesForTemplateSet("minimal", expectedTemplates)).toEqual(["AGENTS.md"]);
    expect(getFilesForTemplateSet("standard", expectedTemplates)).toEqual([
      "AGENTS.md",
      "CODE-QUALITY.md",
      "DESIGN-SYSTEM.md",
      "WORKFLOWS.md",
    ]);
    expect(getFilesForTemplateSet("full", expectedTemplates)).toEqual(expectedTemplates);
  });

  test("combines template set and AI tool files", () => {
    expect(getSelectedTemplateFiles("minimal", ["cursor", "claude"], expectedTemplates)).toEqual([
      ".cursor/rules/agentkit.md",
      "AGENTS.md",
      "CLAUDE.md",
    ]);
  });

  test("init creates expected files recursively", () => {
    const target = tempDir();
    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(0);
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(target, file)), file).toBe(true);
    }
    expect(fs.readFileSync(path.join(target, "AGENTS.md"), "utf8")).toMatch(
      /<!-- agentkit:start agents -->/,
    );
    expect(fs.existsSync(path.join(target, "STACK.md"))).toBe(false);
  });

  test("init --preset next creates stack guidance and references it from AGENTS.md", () => {
    const target = tempDir();
    const result = run(["init", target, "--yes", "--preset", "next"]);

    expect(result.status).toBe(0);
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(target, file)), file).toBe(true);
    }

    const stack = fs.readFileSync(path.join(target, "STACK.md"), "utf8");
    const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");

    expect(stack).toMatch(/Next\.js/);
    expect(stack).toMatch(/<!-- agentkit:start stack -->/);
    expect(agents).toMatch(/STACK\.md/);
    expect(result.stdout).toMatch(/STACK\.md/);
  });

  test("init --preset fullstack includes Next.js and Convex guidance", () => {
    const target = tempDir();
    const result = run(["init", target, "--yes", "--preset", "fullstack"]);

    expect(result.status).toBe(0);

    const stack = fs.readFileSync(path.join(target, "STACK.md"), "utf8");

    expect(stack).toMatch(/Next\.js/);
    expect(stack).toMatch(/Convex/);
  });

  test("init defaults to current working directory", () => {
    const target = tempDir();
    const result = run(["init", "--yes"], { cwd: target });

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(target, "AGENTS.md"))).toBe(true);
  });

  test("init skips existing files by default", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "custom content\n");

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).toBe("custom content\n");
    expect(result.stdout).toMatch(/Skipped existing: AGENTS\.md/);
  });

  test("init --force overwrites existing files", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "custom content\n");

    const result = run(["init", target, "--yes", "--force"]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).not.toBe("custom content\n");
    expect(fs.readFileSync(agentsPath, "utf8")).toMatch(/<!-- agentkit:start agents -->/);
  });

  test("init --dry-run writes nothing", () => {
    const target = path.join(tempDir(), "nested-target");
    const result = run(["init", target, "--yes", "--dry-run"]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
    expect(result.stdout).toMatch(/Would install/);
  });

  test("init --dry-run --preset next writes nothing but reports STACK.md", () => {
    const target = path.join(tempDir(), "nested-target");
    const result = run(["init", target, "--yes", "--dry-run", "--preset", "next"]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
    expect(result.stdout).toMatch(/Would create: .*STACK\.md/);
  });

  test("invalid preset exits non-zero and lists valid presets", () => {
    const result = run(["init", tempDir(), "--yes", "--preset", "rails"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown preset "rails"/);
    expect(result.stderr).toMatch(/next, sveltekit, express, convex, fullstack/);
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

  test("update creates missing managed files", () => {
    const target = tempDir();
    const result = run(["update", target]);

    expect(result.status).toBe(0);
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(target, file)), file).toBe(true);
    }
    expect(fs.readFileSync(path.join(target, "CODE-QUALITY.md"), "utf8")).toMatch(
      /<!-- agentkit:start code-quality -->/,
    );
    expect(result.stdout).toMatch(/Created:/);
  });

  test("update replaces only managed block content", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(
      agentsPath,
      "custom header\n<!-- agentkit:start agents -->\nold generated content\n<!-- agentkit:end agents -->\ncustom footer\n",
    );

    const result = run(["update", target]);
    const agents = fs.readFileSync(agentsPath, "utf8");

    expect(result.status).toBe(0);
    expect(agents).toMatch(/^custom header\n/);
    expect(agents).toMatch(/# \[Project Name\] Agent Guide/);
    expect(agents).toMatch(/custom footer\n$/);
    expect(agents).not.toMatch(/old generated content/);
    expect(result.stdout).toMatch(/Updated: AGENTS\.md/);
  });

  test("update skips unmanaged legacy files", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "custom content\n");

    const result = run(["update", target]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).toBe("custom content\n");
    expect(result.stdout).toMatch(/Skipped unmanaged: AGENTS\.md/);
  });

  test("update skips malformed managed blocks", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(agentsPath, "<!-- agentkit:start agents -->\nmissing end marker\n");

    const result = run(["update", target]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).toBe(
      "<!-- agentkit:start agents -->\nmissing end marker\n",
    );
    expect(result.stdout).toMatch(/Skipped malformed: AGENTS\.md/);
  });

  test("update --dry-run writes nothing", () => {
    const target = tempDir();
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(
      agentsPath,
      "<!-- agentkit:start agents -->\nold generated content\n<!-- agentkit:end agents -->\n",
    );

    const result = run(["update", target, "--dry-run"]);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(agentsPath, "utf8")).toBe(
      "<!-- agentkit:start agents -->\nold generated content\n<!-- agentkit:end agents -->\n",
    );
    expect(result.stdout).toMatch(/Would update: AGENTS\.md/);
  });

  test("update --preset next updates stack guidance and AGENTS.md preset reference", () => {
    const target = tempDir();
    const stackPath = path.join(target, "STACK.md");
    const agentsPath = path.join(target, "AGENTS.md");
    fs.writeFileSync(
      agentsPath,
      "<!-- agentkit:start agents -->\nold agents\n<!-- agentkit:end agents -->\n",
    );
    fs.writeFileSync(
      stackPath,
      "<!-- agentkit:start stack -->\nold stack\n<!-- agentkit:end stack -->\n",
    );

    const result = run(["update", target, "--preset", "next"]);
    const agents = fs.readFileSync(agentsPath, "utf8");
    const stack = fs.readFileSync(stackPath, "utf8");

    expect(result.status).toBe(0);
    expect(agents).toMatch(/Preset: Next\.js/);
    expect(agents).toMatch(/STACK\.md/);
    expect(stack).toMatch(/Next\.js/);
    expect(stack).not.toMatch(/old stack/);
    expect(result.stdout).toMatch(/Updated: .*AGENTS\.md/);
    expect(result.stdout).toMatch(/Updated: .*STACK\.md/);
  });
});
