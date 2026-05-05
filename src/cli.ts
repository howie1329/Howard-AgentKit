#!/usr/bin/env node

import { confirm, isCancel, select, text } from "@clack/prompts";
import { Command } from "commander";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PresetName = "next" | "sveltekit" | "express" | "convex" | "fullstack";

type InitOptions = {
  force?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  interactive?: boolean;
  preset?: string;
};

type InstallResult = {
  targetDir: string;
  created: string[];
  skipped: string[];
};

type UpdateOptions = {
  dryRun?: boolean;
  preset?: string;
};

type UpdateResult = {
  targetDir: string;
  created: string[];
  updated: string[];
  skipped: string[];
  malformed: string[];
  unchanged: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(packageRoot, "templates");
const packageJsonPath = path.join(packageRoot, "package.json");
const validPresets: PresetName[] = ["next", "sveltekit", "express", "convex", "fullstack"];

const presetLabels: Record<PresetName, string> = {
  next: "Next.js",
  sveltekit: "SvelteKit",
  express: "Express",
  convex: "Convex",
  fullstack: "Fullstack",
};

const stackGuidance: Record<Exclude<PresetName, "fullstack">, string> = {
  next: `# Stack Guidance

## Next.js

- Follow the app's existing routing model before adding new routes or layouts.
- Keep server and client component boundaries explicit.
- Prefer server components for data loading unless interactivity requires a client component.
- Keep mutations in server actions, route handlers, or existing API layers based on local patterns.
- Use established styling primitives and design tokens before adding new UI conventions.
- Validate external input at route, action, and API boundaries.
- Run the project's Next.js build or typecheck before handoff when touching routing, rendering, or data loading.
`,
  sveltekit: `# Stack Guidance

## SvelteKit

- Follow the existing route, load, action, and server module patterns before adding new files.
- Keep browser-only code out of server load functions and server modules.
- Use SvelteKit form actions and load functions where they fit the workflow.
- Validate external input at action, endpoint, and server boundary entrypoints.
- Reuse existing stores, components, and styling conventions before creating new ones.
- Run the project's SvelteKit check or build before handoff when touching routes, rendering, or data loading.
`,
  express: `# Stack Guidance

## Express

- Keep route handlers small and move repeated business logic only when duplication is real.
- Validate request params, query strings, and bodies at the route boundary.
- Return explicit status codes and predictable response shapes.
- Use the project's existing middleware order and error handling pattern.
- Avoid adding global middleware or dependencies for narrow endpoint changes.
- Add focused tests for route behavior, validation failures, and error paths.
`,
  convex: `# Stack Guidance

## Convex

- Follow generated Convex types and local function patterns before editing schema or functions.
- Keep queries, mutations, and actions focused on one clear responsibility.
- Validate arguments with Convex validators at public function boundaries.
- Preserve explicit authorization checks for user-scoped data.
- Prefer indexes and schema changes that match real query needs.
- Run Convex codegen or the project's Convex validation command after schema or function changes.
`,
};

const fullstackGuidance = `${stackGuidance.next}
${stackGuidance.convex.replace("# Stack Guidance\n\n", "")}`;

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readPackageVersion(): Promise<string> {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version?: string;
  };

  return packageJson.version ?? "0.0.0";
}

async function getTemplateFiles(dir = templatesDir, base = templatesDir): Promise<string[]> {
  const dirStat = await stat(dir);

  if (!dirStat.isDirectory()) {
    throw new Error(`Bundled templates directory not found: ${templatesDir}`);
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return getTemplateFiles(absolutePath, base);
      }

      if (!entry.isFile()) {
        return [];
      }

      return [path.relative(base, absolutePath).split(path.sep).join("/")];
    }),
  );

  return files.flat().sort();
}

function isPresetName(value: string): value is PresetName {
  return validPresets.includes(value as PresetName);
}

function formatPresetList(): string {
  return validPresets.join(", ");
}

function resolvePreset(preset: string | undefined): PresetName | undefined {
  if (!preset) {
    return undefined;
  }

  const normalizedPreset = preset.toLowerCase();

  if (!isPresetName(normalizedPreset)) {
    throw new Error(`Unknown preset "${preset}". Valid presets: ${formatPresetList()}.`);
  }

  return normalizedPreset;
}

function getStackGuidance(preset: PresetName): string {
  return preset === "fullstack" ? fullstackGuidance : stackGuidance[preset];
}

function getTemplateId(file: string): string {
  return file
    .replace(/\.[^/.]+$/, "")
    .replace(/^\./, "")
    .split("/")
    .filter(Boolean)
    .join("-")
    .toLowerCase();
}

function wrapManagedBlock(file: string, content: string): string {
  const id = getTemplateId(file);
  return `<!-- agentkit:start ${id} -->\n${content.trimEnd()}\n<!-- agentkit:end ${id} -->\n`;
}

function addStackReference(file: string, content: string, preset: PresetName | undefined): string {
  if (file !== "AGENTS.md" || !preset) {
    return content;
  }

  const stackNote = `\nPreset: ${presetLabels[preset]}. Agents must read \`STACK.md\` before changing stack-specific code.\n`;

  if (content.includes("## Guidelines")) {
    return content.replace("\n## Guidelines", `${stackNote}\n## Guidelines`);
  }

  return `${content.trimEnd()}\n${stackNote}`;
}

async function installTemplates(
  targetArg: string | undefined,
  options: InitOptions,
): Promise<InstallResult> {
  const targetDir = path.resolve(process.cwd(), targetArg || ".");
  const files = await getTemplateFiles();
  const preset = resolvePreset(options.preset);
  const created: string[] = [];
  const skipped: string[] = [];

  if (!options.dryRun) {
    await mkdir(targetDir, { recursive: true });
  }

  for (const file of files) {
    const source = path.join(templatesDir, file);
    const destination = path.join(targetDir, file);
    const destinationExists = await exists(destination);

    if (destinationExists && !options.force) {
      skipped.push(file);
      continue;
    }

    created.push(file);

    if (!options.dryRun) {
      await mkdir(path.dirname(destination), { recursive: true });
      if (preset && file === "AGENTS.md") {
        const content = await readFile(source, "utf8");
        await writeFile(destination, wrapManagedBlock(file, addStackReference(file, content, preset)));
      } else {
        const content = await readFile(source, "utf8");
        await writeFile(destination, wrapManagedBlock(file, content));
      }
    }
  }

  if (preset) {
    const stackFile = "STACK.md";
    const destination = path.join(targetDir, stackFile);
    const destinationExists = await exists(destination);

    if (destinationExists && !options.force) {
      skipped.push(stackFile);
    } else {
      created.push(stackFile);

      if (!options.dryRun) {
        await writeFile(destination, wrapManagedBlock(stackFile, getStackGuidance(preset)));
      }
    }
  }

  return { targetDir, created, skipped };
}

function replaceManagedBlock(file: string, existingContent: string, nextContent: string): string | undefined {
  const id = getTemplateId(file);
  const startMarker = `<!-- agentkit:start ${id} -->`;
  const endMarker = `<!-- agentkit:end ${id} -->`;
  const startIndex = existingContent.indexOf(startMarker);
  const endIndex = existingContent.indexOf(endMarker);

  if (startIndex === -1 && endIndex === -1) {
    return undefined;
  }

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Malformed managed block in ${file}.`);
  }

  const afterEndIndex = endIndex + endMarker.length;
  const replacement = wrapManagedBlock(file, nextContent).trimEnd();

  return `${existingContent.slice(0, startIndex)}${replacement}${existingContent.slice(afterEndIndex)}`;
}

async function buildTemplateContent(file: string, preset: PresetName | undefined): Promise<string> {
  if (file === "STACK.md") {
    if (!preset) {
      throw new Error("STACK.md requires a preset.");
    }

    return getStackGuidance(preset);
  }

  const source = path.join(templatesDir, file);
  const content = await readFile(source, "utf8");
  return addStackReference(file, content, preset);
}

async function updateTemplates(
  targetArg: string | undefined,
  options: UpdateOptions,
): Promise<UpdateResult> {
  const targetDir = path.resolve(process.cwd(), targetArg || ".");
  const preset = resolvePreset(options.preset);
  const files = preset ? [...(await getTemplateFiles()), "STACK.md"] : await getTemplateFiles();
  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const malformed: string[] = [];
  const unchanged: string[] = [];

  for (const file of files) {
    const destination = path.join(targetDir, file);
    const nextContent = await buildTemplateContent(file, preset);
    const destinationExists = await exists(destination);

    if (!destinationExists) {
      created.push(file);

      if (!options.dryRun) {
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, wrapManagedBlock(file, nextContent));
      }

      continue;
    }

    const existingContent = await readFile(destination, "utf8");
    let updatedContent: string | undefined;

    try {
      updatedContent = replaceManagedBlock(file, existingContent, nextContent);
    } catch {
      malformed.push(file);
      continue;
    }

    if (updatedContent === undefined) {
      skipped.push(file);
      continue;
    }

    if (updatedContent === existingContent) {
      unchanged.push(file);
      continue;
    }

    updated.push(file);

    if (!options.dryRun) {
      await writeFile(destination, updatedContent);
    }
  }

  return { targetDir, created, updated, skipped, malformed, unchanged };
}

function printInstallResult(result: InstallResult, dryRun = false): void {
  const action = dryRun ? "Would install" : "Installed";
  console.log(`${action} AgentKit files in ${result.targetDir}`);

  if (result.created.length > 0) {
    console.log(`${dryRun ? "Would create" : "Created"}: ${result.created.join(", ")}`);
  }

  if (result.skipped.length > 0) {
    console.log(`Skipped existing: ${result.skipped.join(", ")}`);
    console.log("Use --force to overwrite existing files.");
  }

  if (result.created.length === 0 && result.skipped.length === 0) {
    console.log("No bundled templates found.");
  }
}

function printUpdateResult(result: UpdateResult, dryRun = false): void {
  const action = dryRun ? "Would update" : "Updated";
  console.log(`${action} AgentKit files in ${result.targetDir}`);

  if (result.created.length > 0) {
    console.log(`${dryRun ? "Would create" : "Created"}: ${result.created.join(", ")}`);
  }

  if (result.updated.length > 0) {
    console.log(`${dryRun ? "Would update" : "Updated"}: ${result.updated.join(", ")}`);
  }

  if (result.unchanged.length > 0) {
    console.log(`Already current: ${result.unchanged.join(", ")}`);
  }

  if (result.skipped.length > 0) {
    console.log(`Skipped unmanaged: ${result.skipped.join(", ")}`);
    console.log("Add AgentKit managed block markers before updating these files.");
  }

  if (result.malformed.length > 0) {
    console.log(`Skipped malformed: ${result.malformed.join(", ")}`);
    console.log("Fix AgentKit managed block markers before updating these files.");
  }

  if (
    result.created.length === 0 &&
    result.updated.length === 0 &&
    result.skipped.length === 0 &&
    result.malformed.length === 0
  ) {
    console.log("All managed AgentKit files are current.");
  }
}

async function resolveInteractiveTarget(
  target: string | undefined,
  options: InitOptions,
): Promise<string | undefined> {
  const providedPreset = resolvePreset(options.preset);

  if (!options.interactive) {
    return target;
  }

  const targetResponse = await text({
    message: "Where should AgentKit install templates?",
    placeholder: target || ".",
    defaultValue: target || ".",
  });

  if (isCancel(targetResponse)) {
    process.exit(130);
  }

  const forceResponse = await confirm({
    message: "Overwrite existing files?",
    initialValue: Boolean(options.force),
  });

  if (isCancel(forceResponse)) {
    process.exit(130);
  }

  const presetResponse = await select({
    message: "Which preset should AgentKit use?",
    initialValue: providedPreset || "generic",
    options: [
      { label: "Generic", value: "generic" },
      { label: "Next.js", value: "next" },
      { label: "SvelteKit", value: "sveltekit" },
      { label: "Express", value: "express" },
      { label: "Convex", value: "convex" },
      { label: "Fullstack", value: "fullstack" },
    ],
  });

  if (isCancel(presetResponse)) {
    process.exit(130);
  }

  options.preset = presetResponse === "generic" ? undefined : presetResponse;
  options.force = forceResponse;
  return targetResponse || ".";
}

async function main(): Promise<void> {
  if (process.argv.slice(2).includes("--list")) {
    const files = await getTemplateFiles();
    for (const file of files) {
      console.log(file);
    }
    return;
  }

  if (process.argv.slice(2).includes("--list-presets")) {
    for (const preset of validPresets) {
      console.log(preset);
    }
    return;
  }

  const program = new Command();

  program
    .name("agentkit")
    .description("Bootstrap AI-agent-ready repository docs and workflow templates.")
    .version(await readPackageVersion(), "-v, --version")
    .option("--list", "list bundled template files")
    .option("--list-presets", "list available presets")
    .addHelpText(
      "after",
      `

Examples:
  agentkit init
  agentkit update
  agentkit init --preset next
  agentkit init ./my-project --dry-run
  agentkit --list-presets
  agentkit --list`,
    );

  program
    .command("init")
    .description("install AgentKit templates into a project")
    .argument("[target]", "target project directory", ".")
    .option("--force", "overwrite existing files")
    .option("--dry-run", "print planned changes without writing files")
    .option("-i, --interactive", "prompt for install options")
    .option("-y, --yes", "accept defaults for non-interactive runs")
    .option("--preset <name>", `install stack-specific guidance (${formatPresetList()})`)
    .action(async (target: string, options: InitOptions) => {
      const resolvedTarget = await resolveInteractiveTarget(target, options);
      const result = await installTemplates(resolvedTarget, options);
      printInstallResult(result, Boolean(options.dryRun));
    });

  program
    .command("update")
    .description("update AgentKit managed template blocks in a project")
    .argument("[target]", "target project directory", ".")
    .option("--dry-run", "print planned changes without writing files")
    .option("--preset <name>", `update stack-specific guidance (${formatPresetList()})`)
    .action(async (target: string, options: UpdateOptions) => {
      const result = await updateTemplates(target, options);
      printUpdateResult(result, Boolean(options.dryRun));
    });

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
