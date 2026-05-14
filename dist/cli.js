#!/usr/bin/env node
import { confirm, intro, isCancel, multiselect, select, text } from "@clack/prompts";
import { Command } from "commander";
import { constants as fsConstants, realpathSync } from "node:fs";
import { access, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(packageRoot, "templates");
const packageJsonPath = path.join(packageRoot, "package.json");
const validPresets = ["next", "sveltekit", "express", "convex", "fullstack"];
const validProjectTypes = ["generic", ...validPresets];
const validAiTools = ["codex", "cursor", "claude", "copilot"];
const validTemplateSets = ["minimal", "standard", "full"];
const validDesignSystems = ["linear", "apple"];
const designSystemLabels = {
    linear: "Linear-inspired",
    apple: "Apple-inspired",
};
const configFileName = "agentkit.config.json";
const configKeys = ["preset", "templateSet", "aiTools", "designSystem", "personalization"];
const personalizationKeys = [
    "projectName",
    "projectDescription",
    "issueTracker",
    "designSystemPath",
    "briefsPath",
    "testCommand",
    "lintCommand",
    "buildCommand",
    "stackSummary",
];
const presetLabels = {
    next: "Next.js",
    sveltekit: "SvelteKit",
    express: "Express",
    convex: "Convex",
    fullstack: "Fullstack",
};
const aiToolFiles = {
    codex: ["AGENTS.md"],
    cursor: [".cursor/rules/agentkit.md"],
    claude: ["CLAUDE.md"],
    copilot: [".github/copilot-instructions.md"],
};
const templateSetFiles = {
    minimal: ["AGENTS.md"],
    standard: ["AGENTS.md", "CODE-QUALITY.md", "DESIGN-SYSTEM.md", "WORKFLOWS.md"],
    full: [],
};
const stackGuidance = {
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
async function exists(filePath) {
    try {
        await access(filePath, fsConstants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
async function readPackageVersion() {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    return packageJson.version ?? "0.0.0";
}
async function collectInstallableTemplatePaths(dir, base) {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) {
        throw new Error(`Bundled templates directory not found: ${templatesDir}`);
    }
    const entries = await readdir(dir, { withFileTypes: true });
    const discovered = [];
    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (dir === templatesDir && entry.name === "design-systems") {
                continue;
            }
            discovered.push(...(await collectInstallableTemplatePaths(absolutePath, base)));
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        discovered.push(path.relative(base, absolutePath).split(path.sep).join("/"));
    }
    return discovered;
}
async function getTemplateFiles() {
    const discovered = await collectInstallableTemplatePaths(templatesDir, templatesDir);
    const withDesignSystem = discovered.includes("DESIGN-SYSTEM.md")
        ? discovered
        : [...discovered, "DESIGN-SYSTEM.md"];
    return withDesignSystem.sort();
}
function isPresetName(value) {
    return validPresets.includes(value);
}
function isProjectTypeName(value) {
    return validProjectTypes.includes(value);
}
function isAiToolName(value) {
    return validAiTools.includes(value);
}
function isTemplateSetName(value) {
    return validTemplateSets.includes(value);
}
function isDesignSystemName(value) {
    return validDesignSystems.includes(value);
}
function formatPresetList() {
    return validPresets.join(", ");
}
function formatTemplateSetList() {
    return validTemplateSets.join(", ");
}
function formatDesignSystemList() {
    return validDesignSystems.join(", ");
}
function resolveDesignSystem(name) {
    const normalized = name.toLowerCase();
    if (!isDesignSystemName(normalized)) {
        throw new Error(`Unknown design system "${name}". Valid design systems: ${formatDesignSystemList()}.`);
    }
    return normalized;
}
function effectiveDesignSystem(name) {
    const trimmed = name?.trim();
    if (!trimmed) {
        return "linear";
    }
    return resolveDesignSystem(trimmed);
}
function resolvePreset(preset) {
    if (!preset) {
        return undefined;
    }
    const normalizedPreset = preset.toLowerCase();
    if (!isPresetName(normalizedPreset)) {
        throw new Error(`Unknown preset "${preset}". Valid presets: ${formatPresetList()}.`);
    }
    return normalizedPreset;
}
function resolveTemplateSet(templateSet) {
    if (!templateSet) {
        return undefined;
    }
    const normalizedTemplateSet = templateSet.toLowerCase();
    if (!isTemplateSetName(normalizedTemplateSet)) {
        throw new Error(`Unknown template set "${templateSet}". Valid template sets: ${formatTemplateSetList()}.`);
    }
    return normalizedTemplateSet;
}
function assertPlainObject(value, name) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${name} must be an object.`);
    }
}
function assertKnownKeys(value, validKeys, name) {
    for (const key of Object.keys(value)) {
        if (!validKeys.includes(key)) {
            throw new Error(`Unknown ${name} key "${key}". Valid keys: ${validKeys.join(", ")}.`);
        }
    }
}
function parseConfig(rawConfig, configPath) {
    assertPlainObject(rawConfig, configFileName);
    assertKnownKeys(rawConfig, configKeys, configFileName);
    const config = {};
    if (rawConfig.preset !== undefined) {
        if (typeof rawConfig.preset !== "string") {
            throw new Error(`${configFileName} preset must be a string.`);
        }
        config.preset = resolvePreset(rawConfig.preset);
    }
    if (rawConfig.templateSet !== undefined) {
        if (typeof rawConfig.templateSet !== "string") {
            throw new Error(`${configFileName} templateSet must be a string.`);
        }
        config.templateSet = resolveTemplateSet(rawConfig.templateSet);
    }
    if (rawConfig.aiTools !== undefined) {
        if (!Array.isArray(rawConfig.aiTools)) {
            throw new Error(`${configFileName} aiTools must be an array.`);
        }
        config.aiTools = rawConfig.aiTools.map((aiTool) => {
            if (typeof aiTool !== "string" || !isAiToolName(aiTool)) {
                throw new Error(`Unknown AI tool "${String(aiTool)}". Valid AI tools: ${validAiTools.join(", ")}.`);
            }
            return aiTool;
        });
    }
    if (rawConfig.designSystem !== undefined) {
        if (typeof rawConfig.designSystem !== "string") {
            throw new Error(`${configFileName} designSystem must be a string.`);
        }
        config.designSystem = resolveDesignSystem(rawConfig.designSystem);
    }
    if (rawConfig.personalization !== undefined) {
        assertPlainObject(rawConfig.personalization, `${configFileName} personalization`);
        assertKnownKeys(rawConfig.personalization, personalizationKeys, `${configFileName} personalization`);
        config.personalization = {};
        for (const [key, value] of Object.entries(rawConfig.personalization)) {
            if (typeof value !== "string") {
                throw new Error(`${configFileName} personalization.${key} must be a string.`);
            }
            config.personalization[key] = value;
        }
    }
    if (config.preset === undefined && rawConfig.preset !== undefined) {
        throw new Error(`Invalid preset in ${configPath}.`);
    }
    return config;
}
async function readConfig(configPath) {
    let rawContent;
    try {
        rawContent = await readFile(configPath, "utf8");
    }
    catch {
        throw new Error(`Unable to read ${configPath}.`);
    }
    try {
        return parseConfig(JSON.parse(rawContent), configPath);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid ${configPath}: ${message}`);
    }
}
async function loadConfigForTarget(targetArg) {
    const cwd = process.cwd();
    const targetDir = path.resolve(cwd, targetArg || ".");
    const targetConfigPath = path.join(targetDir, configFileName);
    if (await exists(targetConfigPath)) {
        return readConfig(targetConfigPath);
    }
    const cwdConfigPath = path.join(cwd, configFileName);
    if (targetDir !== cwd && (await exists(cwdConfigPath))) {
        return readConfig(cwdConfigPath);
    }
    return undefined;
}
async function applyInitConfig(options, config) {
    if (!config) {
        return;
    }
    options.preset ??= config.preset;
    options.designSystem ??= config.designSystem;
    options.personalization ??= config.personalization;
    options.templateSet ??= config.templateSet;
    options.aiTools ??= config.aiTools;
}
function applyUpdateConfig(options, config) {
    if (!config) {
        return;
    }
    options.preset ??= config.preset;
    options.designSystem ??= config.designSystem;
}
export function resolveProjectPreset(projectType) {
    if (!projectType) {
        return undefined;
    }
    const normalizedProjectType = projectType.toLowerCase();
    if (!isProjectTypeName(normalizedProjectType)) {
        throw new Error(`Unknown project type "${projectType}". Valid project types: ${validProjectTypes.join(", ")}.`);
    }
    return normalizedProjectType === "generic" ? undefined : normalizedProjectType;
}
export function getFilesForAiTools(aiTools) {
    const files = new Set();
    for (const aiTool of aiTools) {
        if (!isAiToolName(aiTool)) {
            throw new Error(`Unknown AI tool "${aiTool}". Valid AI tools: ${validAiTools.join(", ")}.`);
        }
        for (const file of aiToolFiles[aiTool]) {
            files.add(file);
        }
    }
    return [...files].sort();
}
export function getFilesForTemplateSet(templateSet, allTemplateFiles) {
    if (templateSet === "full") {
        return [...allTemplateFiles].sort();
    }
    return templateSetFiles[templateSet].filter((file) => allTemplateFiles.includes(file)).sort();
}
export function getSelectedTemplateFiles(templateSet, aiTools, allTemplateFiles) {
    const files = new Set([...getFilesForTemplateSet(templateSet, allTemplateFiles), ...getFilesForAiTools(aiTools)]);
    return [...files].filter((file) => allTemplateFiles.includes(file)).sort();
}
function getStackGuidance(preset) {
    return preset === "fullstack" ? fullstackGuidance : stackGuidance[preset];
}
function getTemplateId(file) {
    return file
        .replace(/\.[^/.]+$/, "")
        .replace(/^\./, "")
        .split("/")
        .filter(Boolean)
        .join("-")
        .toLowerCase();
}
function wrapManagedBlock(file, content) {
    const id = getTemplateId(file);
    return `<!-- agentkit:start ${id} -->\n${content.trimEnd()}\n<!-- agentkit:end ${id} -->\n`;
}
function addStackReference(file, content, preset) {
    if (file !== "AGENTS.md" || !preset) {
        return content;
    }
    const stackNote = `\nPreset: ${presetLabels[preset]}. Agents must read \`STACK.md\` before changing stack-specific code.\n`;
    if (content.includes("## Guidelines")) {
        return content.replace("\n## Guidelines", `${stackNote}\n## Guidelines`);
    }
    return `${content.trimEnd()}\n${stackNote}`;
}
function cleanPersonalizationValue(value) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}
function getResolvedConfig(options) {
    const config = {
        templateSet: options.templateSet ?? "full",
        aiTools: options.aiTools ?? [],
        designSystem: effectiveDesignSystem(options.designSystem),
    };
    const preset = resolvePreset(options.preset);
    if (preset) {
        config.preset = preset;
    }
    if (options.personalization) {
        const personalization = {};
        for (const key of personalizationKeys) {
            const value = cleanPersonalizationValue(options.personalization[key]);
            if (value) {
                personalization[key] = value;
            }
        }
        if (Object.keys(personalization).length > 0) {
            config.personalization = personalization;
        }
    }
    return config;
}
function serializeConfig(config) {
    return `${JSON.stringify(config, null, 2)}\n`;
}
function replaceIfProvided(content, placeholder, value) {
    const replacement = cleanPersonalizationValue(value);
    return replacement ? content.replaceAll(placeholder, replacement) : content;
}
function getProvidedCommands(values) {
    return [values.testCommand, values.lintCommand, values.buildCommand]
        .map(cleanPersonalizationValue)
        .filter((command) => Boolean(command));
}
function commandDescription(command, kind) {
    const descriptions = {
        test: "Run tests",
        lint: "Run lint checks",
        build: "Build or check the project",
    };
    return descriptions[kind] ?? command;
}
function replaceCommandBlock(content, commands) {
    if (commands.length === 0) {
        return content;
    }
    const commandBlock = ["```bash", ...commands, "```"].join("\n");
    return content
        .replace(/```bash\nnpm install\nnpm test\nnpm run build\nnpm run lint\n```/, commandBlock)
        .replace(/```bash\nnpm test\nnpm run lint\nnpm run build\n```/, commandBlock);
}
function replaceAgentCommandTable(content, values) {
    const rows = [
        cleanPersonalizationValue(values.testCommand)
            ? `| \`${cleanPersonalizationValue(values.testCommand)}\` | ${commandDescription(values.testCommand ?? "", "test")} |`
            : undefined,
        cleanPersonalizationValue(values.lintCommand)
            ? `| \`${cleanPersonalizationValue(values.lintCommand)}\` | ${commandDescription(values.lintCommand ?? "", "lint")} |`
            : undefined,
        cleanPersonalizationValue(values.buildCommand)
            ? `| \`${cleanPersonalizationValue(values.buildCommand)}\` | ${commandDescription(values.buildCommand ?? "", "build")} |`
            : undefined,
    ].filter((row) => Boolean(row));
    if (rows.length === 0) {
        return content;
    }
    const nextTable = ["| Command | Description |", "| --- | --- |", ...rows].join("\n");
    return content.replace(/\| Command \| Description \|\n\| --- \| --- \|\n\| `npm run dev` \| Start the local development server \|\n\| `npm test` \| Run tests \|\n\| `npm run lint` \| Run lint checks \|\n\| `npm run build` \| Build the project \|/, nextTable);
}
function replaceStackSummary(content, stackSummary) {
    const summary = cleanPersonalizationValue(stackSummary);
    if (!summary) {
        return content;
    }
    const stackItems = summary
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `- ${item}`)
        .join("\n");
    return content.replace(/- \[Primary framework\]\n- \[Language\/runtime\]\n- \[Backend\/data layer\]\n- \[Styling system\]\n- \[Test tools\]\n- \[Lint\/format tools\]/, stackItems);
}
export function personalizeTemplateContent(file, content, values) {
    if (!values) {
        return content;
    }
    if (file === "PRD-TEMPLATE.md" ||
        file === "IMPLEMENTATION-BRIEF-TEMPLATE.md" ||
        file === ".github/pull_request_template.md") {
        return content;
    }
    let personalized = content;
    if (file === "AGENTS.md" || file === "DESIGN-SYSTEM.md") {
        personalized = replaceIfProvided(personalized, "[Project Name]", values.projectName);
    }
    if (file === "AGENTS.md") {
        personalized = replaceIfProvided(personalized, "[short project description]", values.projectDescription);
        personalized = replaceIfProvided(personalized, "[issue tracker, e.g. Linear or GitHub Issues]", values.issueTracker);
        personalized = replaceIfProvided(personalized, "[design system path, e.g. docs/design-system.md]", values.designSystemPath);
        personalized = replaceIfProvided(personalized, "[design system path]", values.designSystemPath);
        personalized = replaceIfProvided(personalized, "[briefs path, e.g. docs/briefs]", values.briefsPath);
        personalized = replaceIfProvided(personalized, "[test command, e.g. npm test]", values.testCommand);
        personalized = replaceIfProvided(personalized, "[lint command, e.g. npm run lint]", values.lintCommand);
        personalized = replaceIfProvided(personalized, "[build/check command, e.g. npm run build]", values.buildCommand);
        personalized = replaceAgentCommandTable(personalized, values);
        personalized = replaceStackSummary(personalized, values.stackSummary);
    }
    if (file === "CLAUDE.md" || file === "CODE-QUALITY.md") {
        personalized = replaceCommandBlock(personalized, getProvidedCommands(values));
    }
    return personalized;
}
export function shouldPromptForInit(options, streams) {
    if (options.yes) {
        return false;
    }
    if (options.interactive) {
        return true;
    }
    if (options.dryRun) {
        return false;
    }
    return Boolean(streams.stdin?.isTTY || streams.stdout?.isTTY);
}
async function promptForPersonalization(defaults) {
    const shouldPersonalize = await confirm({
        message: "Personalize template placeholders?",
        initialValue: Boolean(defaults),
    });
    if (isCancel(shouldPersonalize)) {
        process.exit(130);
    }
    if (!shouldPersonalize) {
        return undefined;
    }
    const projectName = await text({
        message: "Project name",
        placeholder: "[Project Name]",
        defaultValue: defaults?.projectName,
    });
    if (isCancel(projectName)) {
        process.exit(130);
    }
    const projectDescription = await text({
        message: "Short project description",
        placeholder: "[short project description]",
        defaultValue: defaults?.projectDescription,
    });
    if (isCancel(projectDescription)) {
        process.exit(130);
    }
    const issueTracker = await text({
        message: "Issue tracker name",
        placeholder: "Linear or GitHub Issues",
        defaultValue: defaults?.issueTracker,
    });
    if (isCancel(issueTracker)) {
        process.exit(130);
    }
    const designSystemPath = await text({
        message: "Design system path",
        placeholder: "docs/design-system.md",
        defaultValue: defaults?.designSystemPath,
    });
    if (isCancel(designSystemPath)) {
        process.exit(130);
    }
    const briefsPath = await text({
        message: "Briefs path",
        placeholder: "docs/briefs",
        defaultValue: defaults?.briefsPath,
    });
    if (isCancel(briefsPath)) {
        process.exit(130);
    }
    const testCommand = await text({
        message: "Test command",
        placeholder: "npm test",
        defaultValue: defaults?.testCommand,
    });
    if (isCancel(testCommand)) {
        process.exit(130);
    }
    const lintCommand = await text({
        message: "Lint command",
        placeholder: "npm run lint",
        defaultValue: defaults?.lintCommand,
    });
    if (isCancel(lintCommand)) {
        process.exit(130);
    }
    const buildCommand = await text({
        message: "Build/check command",
        placeholder: "npm run build",
        defaultValue: defaults?.buildCommand,
    });
    if (isCancel(buildCommand)) {
        process.exit(130);
    }
    const stackSummary = await text({
        message: "Stack summary",
        placeholder: "Next.js, TypeScript, Tailwind CSS, Vitest",
        defaultValue: defaults?.stackSummary,
    });
    if (isCancel(stackSummary)) {
        process.exit(130);
    }
    return {
        projectName,
        projectDescription,
        issueTracker,
        designSystemPath,
        briefsPath,
        testCommand,
        lintCommand,
        buildCommand,
        stackSummary,
    };
}
async function buildInitTemplateContent(file, preset, personalization, designSystem) {
    const content = await buildTemplateContent(file, preset, designSystem);
    return personalizeTemplateContent(file, content, personalization);
}
async function installTemplates(targetArg, options) {
    const targetDir = path.resolve(process.cwd(), targetArg || ".");
    const allTemplateFiles = await getTemplateFiles();
    const files = options.files ??
        (options.templateSet || options.aiTools
            ? getSelectedTemplateFiles(options.templateSet ?? "full", options.aiTools ?? [], allTemplateFiles)
            : allTemplateFiles);
    const preset = resolvePreset(options.preset);
    const designSystem = effectiveDesignSystem(options.designSystem);
    const created = [];
    const skipped = [];
    if (!options.dryRun) {
        await mkdir(targetDir, { recursive: true });
    }
    if (options.writeConfig) {
        const destination = path.join(targetDir, configFileName);
        const destinationExists = await exists(destination);
        if (destinationExists && !options.force) {
            skipped.push(configFileName);
        }
        else {
            created.push(configFileName);
            if (!options.dryRun) {
                await writeFile(destination, serializeConfig(getResolvedConfig(options)));
            }
        }
    }
    for (const file of files) {
        const destination = path.join(targetDir, file);
        const destinationExists = await exists(destination);
        if (destinationExists && !options.force) {
            skipped.push(file);
            continue;
        }
        created.push(file);
        if (!options.dryRun) {
            await mkdir(path.dirname(destination), { recursive: true });
            const content = await buildInitTemplateContent(file, preset, options.personalization, designSystem);
            await writeFile(destination, wrapManagedBlock(file, content));
        }
    }
    if (preset) {
        const stackFile = "STACK.md";
        const destination = path.join(targetDir, stackFile);
        const destinationExists = await exists(destination);
        if (destinationExists && !options.force) {
            skipped.push(stackFile);
        }
        else {
            created.push(stackFile);
            if (!options.dryRun) {
                await writeFile(destination, wrapManagedBlock(stackFile, getStackGuidance(preset)));
            }
        }
    }
    return { targetDir, created, skipped };
}
function replaceManagedBlock(file, existingContent, nextContent) {
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
async function buildTemplateContent(file, preset, designSystem) {
    if (file === "STACK.md") {
        if (!preset) {
            throw new Error("STACK.md requires a preset.");
        }
        return getStackGuidance(preset);
    }
    if (file === "DESIGN-SYSTEM.md") {
        const source = path.join(templatesDir, "design-systems", `${designSystem}.md`);
        const content = await readFile(source, "utf8");
        return addStackReference(file, content, preset);
    }
    const source = path.join(templatesDir, file);
    const content = await readFile(source, "utf8");
    return addStackReference(file, content, preset);
}
async function updateTemplates(targetArg, options) {
    const targetDir = path.resolve(process.cwd(), targetArg || ".");
    const preset = resolvePreset(options.preset);
    const designSystem = effectiveDesignSystem(options.designSystem);
    const files = preset ? [...(await getTemplateFiles()), "STACK.md"] : await getTemplateFiles();
    const created = [];
    const updated = [];
    const skipped = [];
    const malformed = [];
    const unchanged = [];
    for (const file of files) {
        const destination = path.join(targetDir, file);
        const nextContent = await buildTemplateContent(file, preset, designSystem);
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
        let updatedContent;
        try {
            updatedContent = replaceManagedBlock(file, existingContent, nextContent);
        }
        catch {
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
function printInstallResult(result, dryRun = false) {
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
function printUpdateResult(result, dryRun = false) {
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
    if (result.created.length === 0 &&
        result.updated.length === 0 &&
        result.skipped.length === 0 &&
        result.malformed.length === 0) {
        console.log("All managed AgentKit files are current.");
    }
}
async function resolveInteractiveTarget(target, options) {
    const providedPreset = resolvePreset(options.preset);
    const shouldPrompt = shouldPromptForInit(options, process);
    if (!shouldPrompt) {
        return target;
    }
    intro("Welcome to AgentKit");
    let resolvedTarget = target;
    if (!target || target === ".") {
        const targetResponse = await text({
            message: "Where should AgentKit install files?",
            placeholder: ".",
            defaultValue: ".",
        });
        if (isCancel(targetResponse)) {
            process.exit(130);
        }
        resolvedTarget = targetResponse || ".";
    }
    if (!providedPreset) {
        const projectTypeResponse = await select({
            message: "What type of project is this?",
            initialValue: "generic",
            options: [
                { label: "Generic TypeScript project", value: "generic" },
                { label: "Next.js app", value: "next" },
                { label: "SvelteKit app", value: "sveltekit" },
                { label: "Express API", value: "express" },
                { label: "Convex app", value: "convex" },
                { label: "Fullstack app", value: "fullstack" },
            ],
        });
        if (isCancel(projectTypeResponse)) {
            process.exit(130);
        }
        options.preset = resolveProjectPreset(projectTypeResponse);
    }
    const aiToolResponse = await multiselect({
        message: "Which AI tools do you use?",
        initialValues: options.aiTools ?? ["codex", "cursor", "claude"],
        options: [
            { label: "Codex", value: "codex" },
            { label: "Cursor", value: "cursor" },
            { label: "Claude Code", value: "claude" },
            { label: "GitHub Copilot", value: "copilot" },
        ],
    });
    if (isCancel(aiToolResponse)) {
        process.exit(130);
    }
    const templateSetResponse = await select({
        message: "Which template set do you want?",
        initialValue: options.templateSet ?? "standard",
        options: [
            { label: "Minimal", value: "minimal" },
            { label: "Standard", value: "standard" },
            { label: "Full", value: "full" },
        ],
    });
    if (isCancel(templateSetResponse)) {
        process.exit(130);
    }
    const templateFiles = await getTemplateFiles();
    options.templateSet = templateSetResponse;
    options.aiTools = aiToolResponse;
    options.files = getSelectedTemplateFiles(templateSetResponse, aiToolResponse, templateFiles);
    if (templateSetResponse === "standard" || templateSetResponse === "full") {
        const designSystemResponse = await select({
            message: "Which design system guidance?",
            initialValue: effectiveDesignSystem(options.designSystem),
            options: validDesignSystems.map((value) => ({ label: designSystemLabels[value], value })),
        });
        if (isCancel(designSystemResponse)) {
            process.exit(130);
        }
        options.designSystem = designSystemResponse;
    }
    if (!options.force) {
        const preset = resolvePreset(options.preset);
        const installFiles = preset ? [...options.files, "STACK.md"] : options.files;
        const targetDir = path.resolve(process.cwd(), resolvedTarget || ".");
        const existingFiles = [];
        for (const file of installFiles) {
            if (await exists(path.join(targetDir, file))) {
                existingFiles.push(file);
            }
        }
        if (existingFiles.length > 0) {
            const conflictResponse = await select({
                message: `Existing files found: ${existingFiles.join(", ")}. How should AgentKit handle conflicts?`,
                initialValue: "skip",
                options: [
                    { label: "Skip existing files", value: "skip" },
                    { label: "Overwrite existing files", value: "overwrite" },
                ],
            });
            if (isCancel(conflictResponse)) {
                process.exit(130);
            }
            options.force = conflictResponse === "overwrite";
        }
    }
    options.personalization = await promptForPersonalization(options.personalization);
    return resolvedTarget || ".";
}
async function main() {
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
    if (process.argv.slice(2).includes("--list-design-systems")) {
        for (const designSystem of validDesignSystems) {
            console.log(designSystem);
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
        .option("--list-design-systems", "list available design systems")
        .addHelpText("after", `

Examples:
  agentkit init
  agentkit update
  agentkit init --preset next
  agentkit init ./my-project --yes --dry-run
  agentkit --list-presets
  agentkit --list-design-systems
  agentkit --list`);
    program
        .command("init")
        .description("install AgentKit templates into a project")
        .argument("[target]", "target project directory", ".")
        .option("--force", "overwrite existing files")
        .option("--dry-run", "print planned changes without writing files")
        .option("-i, --interactive", "prompt for install options")
        .option("-y, --yes", "accept defaults for non-interactive runs")
        .option("--write-config", "write resolved install defaults to agentkit.config.json")
        .option("--preset <name>", `install stack-specific guidance (${formatPresetList()})`)
        .option("--design-system <name>", `design system guidance for DESIGN-SYSTEM.md (${formatDesignSystemList()})`)
        .action(async (target, options) => {
        await applyInitConfig(options, await loadConfigForTarget(target));
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
        .option("--design-system <name>", `design system guidance for DESIGN-SYSTEM.md (${formatDesignSystemList()})`)
        .action(async (target, options) => {
        applyUpdateConfig(options, await loadConfigForTarget(target));
        const result = await updateTemplates(target, options);
        printUpdateResult(result, Boolean(options.dryRun));
    });
    await program.parseAsync(process.argv);
}
function resolveCliPath(filePath) {
    try {
        return realpathSync(filePath);
    }
    catch {
        return path.resolve(filePath);
    }
}
function isDirectCliInvocation(argvPath) {
    return Boolean(argvPath && resolveCliPath(argvPath) === resolveCliPath(__filename));
}
if (isDirectCliInvocation(process.argv[1])) {
    main().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message);
        process.exitCode = 1;
    });
}
