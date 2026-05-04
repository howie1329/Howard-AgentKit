#!/usr/bin/env node
import { confirm, isCancel, text } from "@clack/prompts";
import { Command } from "commander";
import { constants as fsConstants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const templatesDir = path.join(packageRoot, "templates");
const packageJsonPath = path.join(packageRoot, "package.json");
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
async function getTemplateFiles(dir = templatesDir, base = templatesDir) {
    const dirStat = await stat(dir);
    if (!dirStat.isDirectory()) {
        throw new Error(`Bundled templates directory not found: ${templatesDir}`);
    }
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return getTemplateFiles(absolutePath, base);
        }
        if (!entry.isFile()) {
            return [];
        }
        return [path.relative(base, absolutePath).split(path.sep).join("/")];
    }));
    return files.flat().sort();
}
async function installTemplates(targetArg, options) {
    const targetDir = path.resolve(process.cwd(), targetArg || ".");
    const files = await getTemplateFiles();
    const created = [];
    const skipped = [];
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
            await copyFile(source, destination);
        }
    }
    return { targetDir, created, skipped };
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
async function resolveInteractiveTarget(target, options) {
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
    options.force = forceResponse;
    return targetResponse || ".";
}
async function main() {
    if (process.argv.slice(2).includes("--list")) {
        const files = await getTemplateFiles();
        for (const file of files) {
            console.log(file);
        }
        return;
    }
    const program = new Command();
    program
        .name("agentkit")
        .description("Bootstrap AI-agent-ready repository docs and workflow templates.")
        .version(await readPackageVersion(), "-v, --version")
        .option("--list", "list bundled template files")
        .addHelpText("after", `

Examples:
  agentkit init
  agentkit init ./my-project --dry-run
  agentkit --list`);
    program
        .command("init")
        .description("install AgentKit templates into a project")
        .argument("[target]", "target project directory", ".")
        .option("--force", "overwrite existing files")
        .option("--dry-run", "print planned changes without writing files")
        .option("-i, --interactive", "prompt for install options")
        .option("-y, --yes", "accept defaults for non-interactive runs")
        .action(async (target, options) => {
        const resolvedTarget = await resolveInteractiveTarget(target, options);
        const result = await installTemplates(resolvedTarget, options);
        printInstallResult(result, Boolean(options.dryRun));
    });
    await program.parseAsync(process.argv);
}
main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
