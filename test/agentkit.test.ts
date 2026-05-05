import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";
import {
  getFilesForAiTools,
  getFilesForTemplateSet,
  getSelectedTemplateFiles,
  personalizeTemplateContent,
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

function writeConfig(target: string, config: unknown) {
  fs.writeFileSync(path.join(target, "agentkit.config.json"), JSON.stringify(config, null, 2));
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

  test("personalizes repository-level AGENTS.md placeholders", () => {
    const content = fs.readFileSync(path.join(templatesDir, "AGENTS.md"), "utf8");
    const personalized = personalizeTemplateContent("AGENTS.md", content, {
      projectName: "Acme CRM",
      projectDescription: "a customer operations dashboard",
      issueTracker: "Linear",
      designSystemPath: "docs/ui.md",
      briefsPath: "docs/briefs",
      testCommand: "pnpm test",
      lintCommand: "pnpm lint",
      buildCommand: "pnpm build",
      stackSummary: "Next.js, TypeScript, PostgreSQL",
    });

    expect(personalized).toMatch(/# Acme CRM Agent Guide/);
    expect(personalized).toMatch(/Acme CRM is a customer operations dashboard/);
    expect(personalized).toMatch(/linked to an issue in Linear/);
    expect(personalized).toMatch(/read `docs\/ui\.md`/);
    expect(personalized).toMatch(/in `docs\/briefs`/);
    expect(personalized).toMatch(/`pnpm test`/);
    expect(personalized).toMatch(/`pnpm lint`/);
    expect(personalized).toMatch(/`pnpm build`/);
    expect(personalized).toMatch(/- Next\.js\n- TypeScript\n- PostgreSQL/);
  });

  test("personalization leaves blank values as placeholders", () => {
    const content = fs.readFileSync(path.join(templatesDir, "AGENTS.md"), "utf8");
    const personalized = personalizeTemplateContent("AGENTS.md", content, {
      projectName: "Acme CRM",
      projectDescription: "",
      testCommand: "   ",
    });

    expect(personalized).toMatch(/# Acme CRM Agent Guide/);
    expect(personalized).toMatch(/\[short project description\]/);
    expect(personalized).toMatch(/\[test command, e\.g\. npm test\]/);
  });

  test("personalizes design system project name only", () => {
    const content = fs.readFileSync(path.join(templatesDir, "DESIGN-SYSTEM.md"), "utf8");
    const personalized = personalizeTemplateContent("DESIGN-SYSTEM.md", content, {
      projectName: "Acme CRM",
      designSystemPath: "docs/ui.md",
    });

    expect(personalized).toMatch(/# Acme CRM Design System/);
    expect(personalized).toMatch(/principles for Acme CRM/);
    expect(personalized).toMatch(/\[theme stylesheet path, e\.g\. src\/styles\.css\]/);
  });

  test("personalizes command blocks in Claude and code quality docs", () => {
    const values = {
      testCommand: "pnpm test",
      lintCommand: "pnpm lint",
      buildCommand: "pnpm build",
    };
    const claude = personalizeTemplateContent(
      "CLAUDE.md",
      fs.readFileSync(path.join(templatesDir, "CLAUDE.md"), "utf8"),
      values,
    );
    const quality = personalizeTemplateContent(
      "CODE-QUALITY.md",
      fs.readFileSync(path.join(templatesDir, "CODE-QUALITY.md"), "utf8"),
      values,
    );

    expect(claude).toMatch(/```bash\npnpm test\npnpm lint\npnpm build\n```/);
    expect(quality).toMatch(/```bash\npnpm test\npnpm lint\npnpm build\n```/);
  });

  test("does not personalize per-work-item templates", () => {
    const values = {
      projectName: "Acme CRM",
      projectDescription: "a customer operations dashboard",
    };

    for (const file of ["PRD-TEMPLATE.md", "IMPLEMENTATION-BRIEF-TEMPLATE.md", ".github/pull_request_template.md"]) {
      const content = fs.readFileSync(path.join(templatesDir, file), "utf8");
      expect(personalizeTemplateContent(file, content, values)).toBe(content);
    }
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
    expect(fs.readFileSync(path.join(target, "AGENTS.md"), "utf8")).toMatch(/\[Project Name\]/);
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

  test("init reads config from target directory", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "convex",
      templateSet: "minimal",
      aiTools: ["claude"],
      personalization: {
        projectName: "Config App",
        projectDescription: "configured docs",
        testCommand: "pnpm test",
      },
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(target, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(target, "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(target, "CODE-QUALITY.md"))).toBe(false);
    expect(fs.existsSync(path.join(target, "STACK.md"))).toBe(true);
    expect(fs.readFileSync(path.join(target, "AGENTS.md"), "utf8")).toMatch(/# Config App Agent Guide/);
    expect(fs.readFileSync(path.join(target, "AGENTS.md"), "utf8")).toMatch(/Config App is configured docs/);
    expect(fs.readFileSync(path.join(target, "CLAUDE.md"), "utf8")).toMatch(/```bash\npnpm test\n```/);
  });

  test("init falls back to cwd config when target has no config", () => {
    const cwd = tempDir();
    const target = path.join(cwd, "target");
    writeConfig(cwd, {
      templateSet: "minimal",
      personalization: {
        projectName: "Fallback App",
      },
    });

    const result = run(["init", target, "--yes"], { cwd });

    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(target, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(target, "CLAUDE.md"))).toBe(false);
    expect(fs.readFileSync(path.join(target, "AGENTS.md"), "utf8")).toMatch(/# Fallback App Agent Guide/);
  });

  test("init target config wins over cwd fallback config", () => {
    const cwd = tempDir();
    const target = path.join(cwd, "target");
    fs.mkdirSync(target);
    writeConfig(cwd, {
      preset: "next",
      personalization: {
        projectName: "Cwd App",
      },
    });
    writeConfig(target, {
      preset: "express",
      templateSet: "minimal",
      personalization: {
        projectName: "Target App",
      },
    });

    const result = run(["init", target, "--yes"], { cwd });
    const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");
    const stack = fs.readFileSync(path.join(target, "STACK.md"), "utf8");

    expect(result.status).toBe(0);
    expect(agents).toMatch(/# Target App Agent Guide/);
    expect(stack).toMatch(/Express/);
    expect(stack).not.toMatch(/Next\.js/);
  });

  test("init cli preset overrides config preset", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "convex",
    });

    const result = run(["init", target, "--yes", "--preset", "next"]);
    const stack = fs.readFileSync(path.join(target, "STACK.md"), "utf8");

    expect(result.status).toBe(0);
    expect(stack).toMatch(/Next\.js/);
    expect(stack).not.toMatch(/Convex/);
  });

  test("init --write-config creates default config", () => {
    const target = tempDir();
    const result = run(["init", target, "--yes", "--write-config"]);
    const config = JSON.parse(fs.readFileSync(path.join(target, "agentkit.config.json"), "utf8")) as unknown;

    expect(result.status).toBe(0);
    expect(config).toEqual({
      templateSet: "full",
      aiTools: [],
    });
    expect(result.stdout).toMatch(/Created: .*agentkit\.config\.json/);
  });

  test("init --write-config writes preset and installs stack guidance", () => {
    const target = tempDir();
    const result = run(["init", target, "--yes", "--write-config", "--preset", "next"]);
    const config = JSON.parse(fs.readFileSync(path.join(target, "agentkit.config.json"), "utf8")) as unknown;

    expect(result.status).toBe(0);
    expect(config).toEqual({
      templateSet: "full",
      aiTools: [],
      preset: "next",
    });
    expect(fs.readFileSync(path.join(target, "STACK.md"), "utf8")).toMatch(/Next\.js/);
  });

  test("init --write-config writes resolved config defaults", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "express",
      templateSet: "minimal",
      aiTools: ["claude"],
      personalization: {
        projectName: "Config App",
        projectDescription: "",
      },
    });

    const result = run(["init", target, "--yes", "--write-config", "--force"]);
    const config = JSON.parse(fs.readFileSync(path.join(target, "agentkit.config.json"), "utf8")) as unknown;

    expect(result.status).toBe(0);
    expect(config).toEqual({
      templateSet: "minimal",
      aiTools: ["claude"],
      preset: "express",
      personalization: {
        projectName: "Config App",
      },
    });
  });

  test("init --write-config skips existing config by default", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "convex",
    });

    const result = run(["init", target, "--yes", "--write-config", "--preset", "next"]);
    const config = JSON.parse(fs.readFileSync(path.join(target, "agentkit.config.json"), "utf8")) as unknown;

    expect(result.status).toBe(0);
    expect(config).toEqual({
      preset: "convex",
    });
    expect(result.stdout).toMatch(/Skipped existing: .*agentkit\.config\.json/);
  });

  test("init --write-config --force overwrites existing config", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "convex",
    });

    const result = run(["init", target, "--yes", "--write-config", "--force", "--preset", "next"]);
    const config = JSON.parse(fs.readFileSync(path.join(target, "agentkit.config.json"), "utf8")) as unknown;

    expect(result.status).toBe(0);
    expect(config).toEqual({
      templateSet: "full",
      aiTools: [],
      preset: "next",
    });
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

  test("init --dry-run reads config but writes nothing", () => {
    const cwd = tempDir();
    const target = path.join(cwd, "nested-target");
    writeConfig(cwd, {
      preset: "next",
      templateSet: "minimal",
    });

    const result = run(["init", target, "--yes", "--dry-run"], { cwd });

    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
    expect(result.stdout).toMatch(/Would create: .*AGENTS\.md/);
    expect(result.stdout).toMatch(/Would create: .*STACK\.md/);
  });

  test("init --dry-run --write-config writes nothing but reports config", () => {
    const target = path.join(tempDir(), "nested-target");
    const result = run(["init", target, "--yes", "--dry-run", "--write-config"]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(target)).toBe(false);
    expect(result.stdout).toMatch(/Would create: .*agentkit\.config\.json/);
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

  test("invalid config json exits non-zero", () => {
    const target = tempDir();
    fs.writeFileSync(path.join(target, "agentkit.config.json"), "{nope");

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Invalid .*agentkit\.config\.json/);
  });

  test("unknown config key exits non-zero", () => {
    const target = tempDir();
    writeConfig(target, {
      files: ["AGENTS.md"],
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown agentkit\.config\.json key "files"/);
  });

  test("invalid config preset exits non-zero", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "rails",
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown preset "rails"/);
  });

  test("invalid config template set exits non-zero", () => {
    const target = tempDir();
    writeConfig(target, {
      templateSet: "docs",
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown template set "docs"/);
  });

  test("invalid config ai tool exits non-zero", () => {
    const target = tempDir();
    writeConfig(target, {
      aiTools: ["windsurf"],
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown AI tool "windsurf"/);
  });

  test("non-string personalization config exits non-zero", () => {
    const target = tempDir();
    writeConfig(target, {
      personalization: {
        projectName: 123,
      },
    });

    const result = run(["init", target, "--yes"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/personalization\.projectName must be a string/);
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

  test("update uses config preset but ignores config template selection", () => {
    const target = tempDir();
    writeConfig(target, {
      preset: "next",
      templateSet: "minimal",
      aiTools: ["claude"],
      personalization: {
        projectName: "Ignored Update Name",
      },
    });

    const result = run(["update", target]);
    const agents = fs.readFileSync(path.join(target, "AGENTS.md"), "utf8");

    expect(result.status).toBe(0);
    for (const file of expectedTemplates) {
      expect(fs.existsSync(path.join(target, file)), file).toBe(true);
    }
    expect(fs.existsSync(path.join(target, "STACK.md"))).toBe(true);
    expect(agents).toMatch(/Preset: Next\.js/);
    expect(agents).toMatch(/# \[Project Name\] Agent Guide/);
    expect(agents).not.toMatch(/Ignored Update Name/);
  });

  test("update does not create or modify config", () => {
    const target = tempDir();
    const configPath = path.join(target, "agentkit.config.json");

    const result = run(["update", target]);

    expect(result.status).toBe(0);
    expect(fs.existsSync(configPath)).toBe(false);

    writeConfig(target, {
      preset: "next",
    });
    const existingConfig = fs.readFileSync(configPath, "utf8");
    const updateExisting = run(["update", target]);

    expect(updateExisting.status).toBe(0);
    expect(fs.readFileSync(configPath, "utf8")).toBe(existingConfig);
  });
});
