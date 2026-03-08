import { type InspectedRepository } from "@/utils/githubRepoInspection";
import { type ReadmeGenerationInput } from "@/utils/synthesizeReadme";

type GenerateFallbackReadmeParams = {
  input: ReadmeGenerationInput;
  repository: InspectedRepository | null;
};

export function generateFallbackReadme({
  input,
  repository,
}: GenerateFallbackReadmeParams) {
  const projectName =
    sanitize(input.projectName) || repository?.repository.name || "Project Name";
  const description =
    sanitize(input.description) ||
    repository?.repository.description ||
    "Project description is not yet documented in the available source material.";

  const sections = [
    `# ${projectName}`,
    description,
    createQuickFacts(repository),
    createOverview(input, repository),
    createTechStack(input, repository),
    createInstallation(projectName, input, repository),
    createUsage(input, repository),
    createScripts(repository),
    createProjectStructure(repository),
    createConfiguration(repository),
    createTesting(repository),
    createLicense(input, repository),
    createAuthor(input, repository),
  ].filter(Boolean);

  return sections.join("\n\n").trim();
}

function createQuickFacts(repository: InspectedRepository | null) {
  if (!repository) {
    return null;
  }

  const facts = [
    `- Repository: ${repository.repository.htmlUrl}`,
    repository.repository.homepage
      ? `- Homepage: ${repository.repository.homepage}`
      : null,
    repository.repository.primaryLanguage
      ? `- Primary language: ${repository.repository.primaryLanguage}`
      : null,
    repository.analysis.frameworks.length
      ? `- Detected stack: ${repository.analysis.frameworks.join(", ")}`
      : null,
  ].filter(Boolean);

  if (!facts.length) {
    return null;
  }

  return [`## Quick Facts`, ...facts].join("\n");
}

function createOverview(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const manualDescription = sanitize(input.description);
  const repositoryDirectories = repository?.analysis.keyDirectories ?? [];
  const overviewLines = [];

  if (manualDescription) {
    overviewLines.push(manualDescription);
  } else if (repository?.repository.description) {
    overviewLines.push(repository.repository.description);
  }

  if (repositoryDirectories.length) {
    overviewLines.push(
      `The inspected repository is organized around ${joinWithAnd(repositoryDirectories)}.`,
    );
  }

  if (repository?.analysis.entryPoints.length) {
    overviewLines.push(
      `Likely application entry points include ${repository.analysis.entryPoints.join(", ")}.`,
    );
  }

  if (!overviewLines.length) {
    return null;
  }

  return [`## Overview`, ...overviewLines].join("\n\n");
}

function createTechStack(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const manualTechStack = sanitize(input.techStack);
  const entries = manualTechStack
    ? splitCsvLike(manualTechStack)
    : [
        ...(repository?.analysis.frameworks ?? []),
        repository?.repository.primaryLanguage,
        ...(repository?.analysis.dependencies.slice(0, 8) ?? []),
      ].filter(Boolean);

  if (!entries.length) {
    return null;
  }

  return ["## Tech Stack", ...Array.from(new Set(entries)).map((entry) => `- ${entry}`)].join(
    "\n",
  );
}

function createInstallation(
  projectName: string,
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const manualInstallation = sanitize(input.installation);

  if (manualInstallation) {
    return `## Installation\n\n${manualInstallation}`;
  }

  const directoryName = toKebabCase(projectName);
  const repositoryUrl = repository?.repository.htmlUrl || sanitize(input.repositoryUrl);
  const installCommand =
    repository?.analysis.installCommand ||
    "Install the project dependencies with the repository's package manager.";

  const steps = [
    "## Installation",
    "",
    "1. Clone the repository.",
    "2. Move into the project directory.",
    "3. Install dependencies.",
    "",
    "```bash",
    repositoryUrl ? `git clone ${repositoryUrl}` : "# clone the repository source",
    `cd ${directoryName}`,
    installCommand,
    "```",
  ];

  return steps.join("\n");
}

function createUsage(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const manualUsage = sanitize(input.usage);

  if (manualUsage) {
    return `## Usage\n\n${manualUsage}`;
  }

  const scripts = repository?.analysis.scripts ?? [];
  const preferredScript =
    scripts.find((script) => script.name === "dev") ||
    scripts.find((script) => script.name === "start") ||
    scripts.find((script) => script.name === "build");

  if (!preferredScript) {
    return repository && repository.analysis.entryPoints.length
      ? [
          "## Usage",
          "",
          "Review the detected entry points below and run the repository using its documented workflow.",
          "",
          ...repository.analysis.entryPoints.map((entryPoint) => `- ${entryPoint}`),
        ].join("\n")
      : null;
  }

  const commandPrefix = commandPrefixFor(
    repository?.analysis.packageManager ?? "unknown",
  );

  return [
    "## Usage",
    "",
    `Run the main project workflow with \`${commandPrefix} ${preferredScript.name}\`.`,
    "",
    "```bash",
    `${commandPrefix} ${preferredScript.name}`,
    "```",
    "",
    preferredScript.description,
  ].join("\n");
}

function createScripts(repository: InspectedRepository | null) {
  const scripts = repository?.analysis.scripts ?? [];

  if (!scripts.length) {
    return null;
  }

  return [
    "## Available Scripts",
    "",
    "| Script | Command | Purpose |",
    "| --- | --- | --- |",
    ...scripts.map(
      (script) =>
        `| \`${script.name}\` | \`${escapeTableCell(script.command)}\` | ${script.description} |`,
    ),
  ].join("\n");
}

function createProjectStructure(repository: InspectedRepository | null) {
  if (!repository) {
    return null;
  }

  const lines = [
    ...repository.analysis.keyDirectories.map(
      (directory) => `- \`${directory}/\` is a notable top-level directory in the repository.`,
    ),
    ...repository.analysis.configFiles.slice(0, 6).map(
      (file) => `- \`${file}\` provides project configuration or build tooling context.`,
    ),
  ];

  if (!lines.length) {
    return null;
  }

  return ["## Project Structure", ...lines].join("\n");
}

function createConfiguration(repository: InspectedRepository | null) {
  if (!repository?.analysis.envFiles.length) {
    return null;
  }

  return [
    "## Configuration",
    "",
    "The repository includes environment-related files. Review them before running the app:",
    "",
    ...repository.analysis.envFiles.map((file) => `- \`${file}\``),
  ].join("\n");
}

function createTesting(repository: InspectedRepository | null) {
  if (!repository) {
    return null;
  }

  const testScript = repository.analysis.scripts.find((script) =>
    script.name.toLowerCase().includes("test"),
  );
  const commandPrefix = commandPrefixFor(repository.analysis.packageManager);

  if (testScript) {
    return [
      "## Testing",
      "",
      repository.analysis.testStrategy,
      "",
      "```bash",
      `${commandPrefix} ${testScript.name}`,
      "```",
    ].join("\n");
  }

  return `## Testing\n\n${repository.analysis.testStrategy}`;
}

function createLicense(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const license =
    sanitize(input.license) ||
    repository?.repository.license ||
    "No license was detected from the inspected repository files.";

  return `## License\n\n${license}`;
}

function createAuthor(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
) {
  const author =
    sanitize(input.author) ||
    (repository
      ? `[@${repository.repository.owner}](https://github.com/${repository.repository.owner})`
      : "Project maintainer details were not provided.");

  return `## Author\n\n${author}`;
}

function commandPrefixFor(packageManager: InspectedRepository["analysis"]["packageManager"]) {
  switch (packageManager) {
    case "pnpm":
      return "pnpm";
    case "yarn":
      return "yarn";
    case "bun":
      return "bun run";
    case "npm":
    default:
      return "npm run";
  }
}

function escapeTableCell(value: string) {
  return value.replace(/\|/g, "\\|");
}

function splitCsvLike(value: string) {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function joinWithAnd(values: string[]) {
  if (values.length <= 1) {
    return values[0] || "";
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function toKebabCase(value: string) {
  return sanitize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function sanitize(value: string | null | undefined) {
  return value?.trim() || "";
}
