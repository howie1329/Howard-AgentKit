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
function optionalConfigString(rawConfig, key) {
    const value = rawConfig[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`${configFileName} ${key} must be a string.`);
    }
    return value;
}
function readConfigAiTools(value) {
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        throw new Error(`${configFileName} aiTools must be an array.`);
    }
    return value.map((aiTool) => {
        if (typeof aiTool !== "string" || !isAiToolName(aiTool)) {
            throw new Error(`Unknown AI tool "${String(aiTool)}". Valid AI tools: ${validAiTools.join(", ")}.`);
        }
        return aiTool;
    });
}
function readConfigPersonalization(value) {
    if (value === undefined) {
        return undefined;
    }
    assertPlainObject(value, `${configFileName} personalization`);
    assertKnownKeys(value, personalizationKeys, `${configFileName} personalization`);
    const personalization = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry !== "string") {
            throw new Error(`${configFileName} personalization.${key} must be a string.`);
        }
        personalization[key] = entry;
    }
    return personalization;
}
function parseConfig(rawConfig, configPath) {
    assertPlainObject(rawConfig, configFileName);
    assertKnownKeys(rawConfig, configKeys, configFileName);
    const preset = optionalConfigString(rawConfig, "preset");
    const templateSet = optionalConfigString(rawConfig, "templateSet");
    const designSystem = optionalConfigString(rawConfig, "designSystem");
    const config = {};
    if (preset !== undefined) {
        config.preset = resolvePreset(preset);
    }
    if (templateSet !== undefined) {
        config.templateSet = resolveTemplateSet(templateSet);
    }
    const aiTools = readConfigAiTools(rawConfig.aiTools);
    if (aiTools !== undefined) {
        config.aiTools = aiTools;
    }
    if (designSystem !== undefined) {
        config.designSystem = resolveDesignSystem(designSystem);
    }
    const personalization = readConfigPersonalization(rawConfig.personalization);
    if (personalization !== undefined) {
        config.personalization = personalization;
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
function resolvePrompt(value) {
    if (isCancel(value)) {
        process.exit(130);
    }
    return value;
}
async function promptForTextValue(message, placeholder, defaultValue) {
    return resolvePrompt(await text({ message, placeholder, defaultValue }));
}
async function promptForPersonalization(defaults) {
    const shouldPersonalize = resolvePrompt(await confirm({
        message: "Personalize template placeholders?",
        initialValue: Boolean(defaults),
    }));
    if (!shouldPersonalize) {
        return undefined;
    }
    return {
        projectName: await promptForTextValue("Project name", "[Project Name]", defaults?.projectName),
        projectDescription: await promptForTextValue("Short project description", "[short project description]", defaults?.projectDescription),
        issueTracker: await promptForTextValue("Issue tracker name", "Linear or GitHub Issues", defaults?.issueTracker),
        designSystemPath: await promptForTextValue("Design system path", "docs/design-system.md", defaults?.designSystemPath),
        briefsPath: await promptForTextValue("Briefs path", "docs/briefs", defaults?.briefsPath),
        testCommand: await promptForTextValue("Test command", "npm test", defaults?.testCommand),
        lintCommand: await promptForTextValue("Lint command", "npm run lint", defaults?.lintCommand),
        buildCommand: await promptForTextValue("Build/check command", "npm run build", defaults?.buildCommand),
        stackSummary: await promptForTextValue("Stack summary", "Next.js, TypeScript, Tailwind CSS, Vitest", defaults?.stackSummary),
    };
}
async function buildInitTemplateContent(file, preset, personalization, designSystem) {
    const content = await buildTemplateContent(file, preset, designSystem);
    return personalizeTemplateContent(file, content, personalization);
}
async function installFileIfAllowed(targetDir, file, options, result, getContent) {
    const destination = path.join(targetDir, file);
    if ((await exists(destination)) && !options.force) {
        result.skipped.push(file);
        return;
    }
    result.created.push(file);
    if (options.dryRun) {
        return;
    }
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, await getContent());
}
async function resolveInitTemplateFiles(options) {
    const allTemplateFiles = await getTemplateFiles();
    if (options.files) {
        return options.files;
    }
    if (options.templateSet || options.aiTools) {
        return getSelectedTemplateFiles(options.templateSet ?? "full", options.aiTools ?? [], allTemplateFiles);
    }
    return allTemplateFiles;
}
async function installTemplates(targetArg, options) {
    const targetDir = path.resolve(process.cwd(), targetArg || ".");
    const files = await resolveInitTemplateFiles(options);
    const preset = resolvePreset(options.preset);
    const designSystem = effectiveDesignSystem(options.designSystem);
    const result = { targetDir, created: [], skipped: [] };
    if (!options.dryRun) {
        await mkdir(targetDir, { recursive: true });
    }
    if (options.writeConfig) {
        await installFileIfAllowed(targetDir, configFileName, options, result, () => serializeConfig(getResolvedConfig(options)));
    }
    for (const file of files) {
        await installFileIfAllowed(targetDir, file, options, result, async () => {
            const content = await buildInitTemplateContent(file, preset, options.personalization, designSystem);
            return wrapManagedBlock(file, content);
        });
    }
    if (preset) {
        await installFileIfAllowed(targetDir, "STACK.md", options, result, () => wrapManagedBlock("STACK.md", getStackGuidance(preset)));
    }
    return result;
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
async function promptForTarget(target) {
    if (target && target !== ".") {
        return target;
    }
    return (resolvePrompt(await text({
        message: "Where should AgentKit install files?",
        placeholder: ".",
        defaultValue: ".",
    })) || ".");
}
async function promptForProjectPreset() {
    const projectType = resolvePrompt(await select({
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
    }));
    return resolveProjectPreset(projectType);
}
async function promptForAiTools(defaults) {
    return resolvePrompt(await multiselect({
        message: "Which AI tools do you use?",
        initialValues: defaults ?? ["codex", "cursor", "claude"],
        options: [
            { label: "Codex", value: "codex" },
            { label: "Cursor", value: "cursor" },
            { label: "Claude Code", value: "claude" },
            { label: "GitHub Copilot", value: "copilot" },
        ],
    }));
}
async function promptForTemplateSet(defaultValue) {
    return resolvePrompt(await select({
        message: "Which template set do you want?",
        initialValue: defaultValue ?? "standard",
        options: [
            { label: "Minimal", value: "minimal" },
            { label: "Standard", value: "standard" },
            { label: "Full", value: "full" },
        ],
    }));
}
async function promptForDesignSystem(defaultValue) {
    return resolvePrompt(await select({
        message: "Which design system guidance?",
        initialValue: effectiveDesignSystem(defaultValue),
        options: validDesignSystems.map((value) => ({ label: designSystemLabels[value], value })),
    }));
}
async function findExistingInstallFiles(target, files) {
    const targetDir = path.resolve(process.cwd(), target || ".");
    const existingFiles = [];
    for (const file of files) {
        if (await exists(path.join(targetDir, file))) {
            existingFiles.push(file);
        }
    }
    return existingFiles;
}
async function promptForConflictStrategy(existingFiles) {
    return resolvePrompt(await select({
        message: `Existing files found: ${existingFiles.join(", ")}. How should AgentKit handle conflicts?`,
        initialValue: "skip",
        options: [
            { label: "Skip existing files", value: "skip" },
            { label: "Overwrite existing files", value: "overwrite" },
        ],
    }));
}
async function applyInteractiveSelections(resolvedTarget, providedPreset, options) {
    if (!providedPreset) {
        options.preset = await promptForProjectPreset();
    }
    const aiTools = await promptForAiTools(options.aiTools);
    const templateSet = await promptForTemplateSet(options.templateSet);
    const templateFiles = await getTemplateFiles();
    options.templateSet = templateSet;
    options.aiTools = aiTools;
    options.files = getSelectedTemplateFiles(templateSet, aiTools, templateFiles);
    if (templateSet === "standard" || templateSet === "full") {
        options.designSystem = await promptForDesignSystem(options.designSystem);
    }
    if (!options.force) {
        const preset = resolvePreset(options.preset);
        const installFiles = preset ? [...options.files, "STACK.md"] : options.files;
        const existingFiles = await findExistingInstallFiles(resolvedTarget, installFiles);
        if (existingFiles.length > 0) {
            options.force = (await promptForConflictStrategy(existingFiles)) === "overwrite";
        }
    }
}
async function resolveInteractiveTarget(target, options) {
    const providedPreset = resolvePreset(options.preset);
    if (!shouldPromptForInit(options, process)) {
        return target;
    }
    intro("Welcome to AgentKit");
    const resolvedTarget = await promptForTarget(target);
    await applyInteractiveSelections(resolvedTarget, providedPreset, options);
    options.personalization = await promptForPersonalization(options.personalization);
    return resolvedTarget;
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
