import {
  GitHubRepositoryError,
  inspectGitHubRepository,
  type InspectedRepository,
} from "@/utils/githubRepoInspection";
import {
  AIConfigurationError,
  generateReadmeWithAI,
} from "@/utils/aiReadmeGenerator";
import { generateFallbackReadme } from "@/utils/fallbackReadmeGenerator";

export type GenerationMode = "github" | "manual";

export type ReadmeGenerationInput = {
  mode: GenerationMode;
  repositoryUrl?: string;
  projectName?: string;
  description?: string;
  installation?: string;
  usage?: string;
  techStack?: string;
  license?: string;
  author?: string;
};

type ReadmeProjectData = {
  projectName: string;
  description: string;
  installation: string;
  usage: string;
  techStack: string;
  license: string;
  author: string;
};

export class ReadmeGenerationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "ReadmeGenerationError";
    this.statusCode = statusCode;
  }
}

export async function synthesizeReadme(input: ReadmeGenerationInput) {
  try {
    const inspectedRepository = await maybeInspectRepository(input);
    let aiResult: { markdown: string; notice: string | null };

    try {
      const generated = await generateReadmeWithAI({
        input,
        repository: inspectedRepository,
      });

      aiResult = {
        markdown: generated.markdown,
        notice: null,
      };
    } catch (error) {
      if (!(error instanceof AIConfigurationError)) {
        throw error;
      }

      aiResult = {
        markdown: generateFallbackReadme({
          input,
          repository: inspectedRepository,
        }),
        notice:
          "AI generation is temporarily unavailable, so the README was assembled from repository evidence and your provided details.",
      };
    }

    const fallbackProjectData = buildFallbackProjectData(input, inspectedRepository);

    return {
      markdown: aiResult.markdown,
      projectName: fallbackProjectData.projectName,
      sourceData: buildSourceData(inspectedRepository, fallbackProjectData),
      notice: aiResult.notice,
    };
  } catch (error) {
    if (
      error instanceof ReadmeGenerationError ||
      error instanceof GitHubRepositoryError ||
      error instanceof AIConfigurationError
    ) {
      throw new ReadmeGenerationError(error.message, error.statusCode);
    }

    throw new ReadmeGenerationError(
      "The README could not be generated right now. Try again in a moment.",
      500,
    );
  }
}

async function maybeInspectRepository(input: ReadmeGenerationInput) {
  if (input.repositoryUrl) {
    return inspectGitHubRepository(input.repositoryUrl);
  }

  if (input.mode === "github") {
    throw new ReadmeGenerationError(
      "Enter a valid GitHub repository URL in the format https://github.com/{owner}/{repo}.",
      400,
    );
  }

  return null;
}

function buildFallbackProjectData(
  input: ReadmeGenerationInput,
  repository: InspectedRepository | null,
): ReadmeProjectData {
  const projectName =
    sanitize(input.projectName) || repository?.repository.name || "Project Name";

  return {
    projectName,
    description:
      sanitize(input.description) ||
      repository?.repository.description ||
      "Add a short description for the project.",
    installation:
      sanitize(input.installation) ||
      buildInstallation(projectName, repository?.repository.htmlUrl),
    usage:
      sanitize(input.usage) ||
      "Run the project using its main development command and review the repository for workflow details.",
    techStack:
      sanitize(input.techStack) ||
      buildTechStack(
        repository?.repository.primaryLanguage,
        repository?.repository.topics ?? [],
      ),
    license:
      sanitize(input.license) ||
      repository?.repository.license ||
      "Add the project license here.",
    author:
      sanitize(input.author) ||
      (repository
        ? `[@${repository.repository.owner}](https://github.com/${repository.repository.owner})`
        : "Add your name or maintainer details here."),
  };
}

function buildSourceData(
  repository: InspectedRepository | null,
  fallbackProjectData: ReadmeProjectData,
) {
  if (!repository) {
    return null;
  }

  return {
    projectName: repository.repository.name,
    description: repository.repository.description || fallbackProjectData.description,
    techStack: buildTechStack(
      repository.repository.primaryLanguage,
      repository.repository.topics,
    ),
    license: repository.repository.license || fallbackProjectData.license,
    repositoryUrl: repository.repository.htmlUrl,
    author: `@${repository.repository.owner}`,
  };
}

function buildInstallation(projectName: string, repositoryUrl?: string) {
  const directoryName = toKebabCase(projectName);
  const cloneBlock = repositoryUrl
    ? `\`\`\`bash
git clone ${repositoryUrl}
cd ${directoryName}
npm install
\`\`\``
    : `\`\`\`bash
# clone or download the project source
cd ${directoryName}
npm install
\`\`\``;

  return `1. Get the project source locally.\n2. Install the dependencies.\n3. Run the main development workflow.\n\n${cloneBlock}`;
}

function buildTechStack(primaryLanguage: string | undefined, topics: string[]) {
  const entries = [sanitize(primaryLanguage), ...topics.map(formatTopic)].filter(Boolean);

  return entries.length
    ? Array.from(new Set(entries)).join(", ")
    : "Add the main frameworks, languages, libraries, and tooling used in the project.";
}

function formatTopic(topic: string) {
  return topic
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
