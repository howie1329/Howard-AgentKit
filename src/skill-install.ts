import { constants as fsConstants } from "node:fs";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const SKILL_DEST_DIR = ".agents/skills/agentkit";
export const CONFIG_FILE_NAME = "agentkit.config.json";

export type SkillInstallConfigInput = {
  preset?: string;
  templateSet?: "minimal" | "standard" | "full";
  aiTools?: string[];
  designSystem?: string;
  personalization?: Record<string, string | undefined>;
};

export type SkillInstallOptions = SkillInstallConfigInput & {
  force?: boolean;
  dryRun?: boolean;
};

export type SkillInstallResult = {
  targetDir: string;
  created: string[];
  skipped: string[];
};

export function getSkillSourceDir(packageRoot: string): string {
  return path.join(packageRoot, "templates", "skills", "agentkit");
}

export async function listSkillFiles(sourceDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, relative);
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  await walk(sourceDir, "");
  return files.sort();
}

export function buildSkillConfig(
  options: SkillInstallConfigInput,
  agentkitVersion: string,
): Record<string, unknown> {
  const config: Record<string, unknown> = {
    installMode: "skill",
    agentkitVersion,
    templateSet: options.templateSet ?? "standard",
    aiTools: options.aiTools ?? [],
    designSystem: options.designSystem ?? "linear",
  };

  if (options.preset) {
    config.preset = options.preset;
  }

  if (options.personalization) {
    const personalization: Record<string, string> = {};

    for (const [key, value] of Object.entries(options.personalization)) {
      const trimmed = value?.trim();
      if (trimmed) {
        personalization[key] = trimmed;
      }
    }

    if (Object.keys(personalization).length > 0) {
      config.personalization = personalization;
    }
  }

  return config;
}

export function getSkillDestinationPaths(skillFiles: string[]): string[] {
  return skillFiles.map((file) => path.posix.join(SKILL_DEST_DIR, file.replace(/\\/g, "/")));
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function installSkill(
  targetArg: string | undefined,
  options: SkillInstallOptions,
  packageRoot: string,
  agentkitVersion: string,
): Promise<SkillInstallResult> {
  const targetDir = path.resolve(process.cwd(), targetArg || ".");
  const sourceDir = getSkillSourceDir(packageRoot);
  const skillFiles = await listSkillFiles(sourceDir);
  const result: SkillInstallResult = { targetDir, created: [], skipped: [] };

  if (!options.dryRun) {
    await mkdir(targetDir, { recursive: true });
  }

  for (const file of skillFiles) {
    const destination = path.join(targetDir, SKILL_DEST_DIR, file);
    const destinationRelative = path.posix.join(SKILL_DEST_DIR, file.replace(/\\/g, "/"));

    if ((await pathExists(destination)) && !options.force) {
      result.skipped.push(destinationRelative);
      continue;
    }

    result.created.push(destinationRelative);

    if (!options.dryRun) {
      await mkdir(path.dirname(destination), { recursive: true });
      const content = await readFile(path.join(sourceDir, file), "utf8");
      await writeFile(destination, content);
    }
  }

  const configPath = path.join(targetDir, CONFIG_FILE_NAME);
  const configRelative = CONFIG_FILE_NAME;

  if ((await pathExists(configPath)) && !options.force) {
    if (!result.skipped.includes(configRelative)) {
      result.skipped.push(configRelative);
    }
  } else {
    if (!result.created.includes(configRelative)) {
      result.created.push(configRelative);
    }

    if (!options.dryRun) {
      const configContent = `${JSON.stringify(buildSkillConfig(options, agentkitVersion), null, 2)}\n`;
      await writeFile(configPath, configContent);
    }
  }

  return result;
}

export function printSkillInstallResult(result: SkillInstallResult, dryRun = false): void {
  if (dryRun) {
    console.log(`Would install AgentKit skill in ${SKILL_DEST_DIR}/`);

    if (result.created.length > 0) {
      console.log(`Would create: ${result.created.join(", ")}`);
    }

    if (result.skipped.length > 0) {
      console.log(`Would skip existing: ${result.skipped.join(", ")}`);
      console.log("Use --force to overwrite existing files.");
    }

    return;
  }

  console.log(`Installed AgentKit skill in ${SKILL_DEST_DIR}/`);
  console.log(`Wrote ${CONFIG_FILE_NAME} (installMode: skill)`);
  console.log("");
  console.log("Next step: In your agent, run agentkit init.");
  console.log("The skill will create AGENTS.md and companion files from your repository.");

  if (result.skipped.length > 0) {
    console.log(`Skipped existing: ${result.skipped.join(", ")}`);
    console.log("Use --force to overwrite existing files.");
  }
}
