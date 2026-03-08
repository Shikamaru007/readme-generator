import { generateReadme, type ReadmeProjectData } from "@/utils/generateReadme";

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

type GitHubRepoSummary = {
  owner: string;
  name: string;
  htmlUrl: string;
  description: string;
  homepage: string;
  topics: string[];
  license: string;
};

export async function synthesizeReadme(input: ReadmeGenerationInput) {
  const repoSummary = await getGitHubRepoSummary(input.repositoryUrl);
  const projectData = buildReadmeProjectData(input, repoSummary);

  return {
    markdown: generateReadme(projectData),
    projectName: projectData.projectName,
  };
}

function buildReadmeProjectData(
  input: ReadmeGenerationInput,
  repoSummary: GitHubRepoSummary | null,
): ReadmeProjectData {
  const projectName =
    sanitize(input.projectName) ||
    repoSummary?.name ||
    deriveProjectNameFromRepoUrl(input.repositoryUrl) ||
    "Project Name";

  return {
    projectName,
    description:
      sanitize(input.description) || buildDescription(projectName, input, repoSummary),
    installation:
      sanitize(input.installation) ||
      buildInstallation(projectName, input.repositoryUrl, repoSummary),
    usage: sanitize(input.usage) || buildUsage(projectName, input, repoSummary),
    techStack: sanitize(input.techStack) || buildTechStack(input, repoSummary),
    license:
      sanitize(input.license) ||
      repoSummary?.license ||
      "Add your preferred license details here.",
    author:
      sanitize(input.author) ||
      (repoSummary
        ? `[@${repoSummary.owner}](https://github.com/${repoSummary.owner})`
        : "Add the project author or maintainer here."),
  };
}

function buildDescription(
  projectName: string,
  input: ReadmeGenerationInput,
  repoSummary: GitHubRepoSummary | null,
) {
  if (repoSummary?.description) {
    const sentence = repoSummary.description.endsWith(".")
      ? repoSummary.description
      : `${repoSummary.description}.`;
    return `${sentence}\n\nThis README draft was generated from the repository metadata and the details currently available.`;
  }

  const techStack = sanitize(input.techStack);
  const usage = sanitize(input.usage);

  if (techStack && usage) {
    return `${projectName} is a ${techStack} project intended to help users ${lowercaseFirst(usage)}.`;
  }

  if (techStack) {
    return `${projectName} is a ${techStack} project with a generated starter README that can be refined as implementation details become clearer.`;
  }

  if (usage) {
    return `${projectName} is a project designed to help users ${lowercaseFirst(usage)}. This draft README captures the most likely setup and usage flow from the information provided so far.`;
  }

  return `${projectName} is a software project with a generated starter README. Expand these sections with product-specific details as development progresses.`;
}

function buildInstallation(
  projectName: string,
  repositoryUrl: string | undefined,
  repoSummary: GitHubRepoSummary | null,
) {
  const repoUrl = repositoryUrl || repoSummary?.htmlUrl;
  const directoryName = repoSummary?.name || toKebabCase(projectName);
  const cloneSteps = repoUrl
    ? `\`\`\`bash
git clone ${repoUrl}
cd ${directoryName}
npm install
\`\`\``
    : `\`\`\`bash
# clone or download the source code
cd ${directoryName}
npm install
\`\`\``;

  return `1. Get the project source locally.\n2. Install the dependencies.\n3. Run the app using the workflow described in the Usage section.\n\n${cloneSteps}`;
}

function buildUsage(
  projectName: string,
  input: ReadmeGenerationInput,
  repoSummary: GitHubRepoSummary | null,
) {
  if (repoSummary?.homepage) {
    return `Install the project, start the local environment, and use ${repoSummary.homepage} as the primary reference for the live experience or deployment target.`;
  }

  if (input.mode === "github" && repoSummary) {
    return `After installation, run the project's primary development command and review the repository at ${repoSummary.htmlUrl} for source structure and contribution context.`;
  }

  return `After installation, run the main development or start command for ${projectName} and validate the expected behavior in your local environment. Add exact commands and examples as the workflow becomes stable.`;
}

function buildTechStack(
  input: ReadmeGenerationInput,
  repoSummary: GitHubRepoSummary | null,
) {
  if (repoSummary?.topics.length) {
    return repoSummary.topics.map(formatTopic).join(", ");
  }

  if (input.mode === "github") {
    return "Document the primary framework, language, and tooling used by this repository.";
  }

  return "Add the primary frameworks, languages, libraries, and deployment tooling used in this project.";
}

async function getGitHubRepoSummary(repositoryUrl: string | undefined) {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);

  if (!parsed) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "readme-generator",
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const repo = (await response.json()) as {
      owner?: { login?: string };
      name?: string;
      html_url?: string;
      description?: string | null;
      homepage?: string | null;
      topics?: string[];
      license?: { spdx_id?: string | null; name?: string | null } | null;
    };

    return {
      owner: repo.owner?.login || parsed.owner,
      name: repo.name || parsed.repo,
      htmlUrl: repo.html_url || `https://github.com/${parsed.owner}/${parsed.repo}`,
      description: sanitize(repo.description),
      homepage: sanitize(repo.homepage),
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      license:
        sanitize(repo.license?.spdx_id) || sanitize(repo.license?.name),
    };
  } catch {
    return null;
  }
}

function parseGitHubRepositoryUrl(repositoryUrl: string | undefined) {
  if (!repositoryUrl) {
    return null;
  }

  try {
    const url = new URL(repositoryUrl.trim());

    if (url.hostname !== "github.com") {
      return null;
    }

    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length < 2) {
      return null;
    }

    return {
      owner: segments[0],
      repo: segments[1].replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

function deriveProjectNameFromRepoUrl(repositoryUrl: string | undefined) {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);

  if (!parsed) {
    return "";
  }

  return parsed.repo
    .split(/[-_]/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

function formatTopic(topic: string) {
  return topic
    .split(/[-_]/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(" ");
}

function toKebabCase(value: string) {
  return sanitize(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function capitalizeWord(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowercaseFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function sanitize(value: string | null | undefined) {
  return value?.trim() || "";
}
