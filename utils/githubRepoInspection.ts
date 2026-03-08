type GitHubRepositoryDetails = {
  owner: string;
  name: string;
  htmlUrl: string;
  description: string;
  homepage: string;
  license: string;
  primaryLanguage: string;
  topics: string[];
  defaultBranch: string;
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
  size?: number;
};

type InspectedRepoFile = {
  path: string;
  content: string;
  size: number;
};

export type RepositoryAnalysis = {
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "cargo" | "go" | "unknown";
  installCommand: string;
  scripts: Array<{ name: string; command: string; description: string }>;
  dependencies: string[];
  devDependencies: string[];
  frameworks: string[];
  envFiles: string[];
  configFiles: string[];
  docsFiles: string[];
  keyDirectories: string[];
  entryPoints: string[];
  testStrategy: string;
  existingReadme: string;
};

export type InspectedRepository = {
  repository: GitHubRepositoryDetails;
  files: InspectedRepoFile[];
  analysis: RepositoryAnalysis;
  summary: string;
};

export class GitHubRepositoryError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "GitHubRepositoryError";
    this.statusCode = statusCode;
  }
}

export async function inspectGitHubRepository(repositoryUrl: string) {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);

  if (!parsed) {
    throw new GitHubRepositoryError(
      "Enter a valid GitHub repository URL in the format https://github.com/{owner}/{repo}.",
      400,
    );
  }

  const repository = await fetchRepositoryDetails(parsed.owner, parsed.repo);
  const tree = await fetchRepositoryTree(parsed.owner, parsed.repo, repository.defaultBranch);
  const candidatePaths = selectCandidatePaths(tree);
  const files = await fetchRepositoryFiles(
    parsed.owner,
    parsed.repo,
    repository.defaultBranch,
    candidatePaths,
  );
  const analysis = analyzeRepository(repository, files);

  return {
    repository,
    files,
    analysis,
    summary: buildRepositorySummary(repository, files, analysis),
  } satisfies InspectedRepository;
}

function parseGitHubRepositoryUrl(repositoryUrl: string) {
  try {
    const url = new URL(repositoryUrl.trim());

    if (!["github.com", "www.github.com"].includes(url.hostname)) {
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

async function fetchRepositoryDetails(owner: string, repo: string) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: buildGitHubHeaders(),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubRepositoryError(
        "That GitHub repository could not be found. Check the owner and repository name, then try again.",
        404,
      );
    }

    throw new GitHubRepositoryError(
      "GitHub repository metadata could not be loaded right now. Try again in a moment.",
      502,
    );
  }

  const repoData = (await response.json()) as {
    owner?: { login?: string };
    name?: string;
    html_url?: string;
    description?: string | null;
    homepage?: string | null;
    language?: string | null;
    topics?: string[];
    default_branch?: string | null;
    license?: { spdx_id?: string | null; name?: string | null } | null;
  };

  return {
    owner: repoData.owner?.login || owner,
    name: repoData.name || repo,
    htmlUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
    description: sanitize(repoData.description),
    homepage: sanitize(repoData.homepage),
    license: sanitize(repoData.license?.spdx_id) || sanitize(repoData.license?.name),
    primaryLanguage: sanitize(repoData.language),
    topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    defaultBranch: sanitize(repoData.default_branch) || "main",
  } satisfies GitHubRepositoryDetails;
}

async function fetchRepositoryTree(owner: string, repo: string, defaultBranch: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    {
      headers: buildGitHubHeaders(),
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    throw new GitHubRepositoryError(
      "The repository tree could not be inspected right now. Try again in a moment.",
      502,
    );
  }

  const treeData = (await response.json()) as {
    tree?: Array<{ path?: string; type?: "blob" | "tree"; size?: number }>;
    truncated?: boolean;
  };

  if (treeData.truncated) {
    throw new GitHubRepositoryError(
      "This repository is too large to inspect with the current generator pipeline.",
      413,
    );
  }

  return (treeData.tree || [])
    .filter((item): item is GitHubTreeItem => Boolean(item.path && item.type))
    .filter((item) => item.type === "blob");
}

function selectCandidatePaths(tree: GitHubTreeItem[]) {
  return tree
    .map((item) => ({
      path: item.path,
      score: scorePath(item.path, item.size ?? 0),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)
    .map((item) => item.path);
}

function scorePath(path: string, size: number) {
  if (size > 60_000) {
    return 0;
  }

  const normalized = path.toLowerCase();
  const fileName = normalized.split("/").at(-1) || normalized;
  let score = 0;

  const exactMatches: Record<string, number> = {
    "package.json": 120,
    "package-lock.json": 105,
    "pnpm-lock.yaml": 105,
    "yarn.lock": 105,
    "bun.lockb": 105,
    "requirements.txt": 120,
    "pyproject.toml": 120,
    "cargo.toml": 120,
    "go.mod": 120,
    "pom.xml": 120,
    "build.gradle": 120,
    "dockerfile": 95,
    "docker-compose.yml": 95,
    "docker-compose.yaml": 95,
    "readme.md": 90,
    "readme.mdx": 90,
    "readme.txt": 70,
    ".env.example": 75,
    "tsconfig.json": 55,
    "next.config.js": 55,
    "next.config.ts": 55,
    "vite.config.ts": 55,
    "vite.config.js": 55,
  };

  score += exactMatches[fileName] || 0;

  if (/^(src|app|pages)\//.test(normalized)) {
    score += 45;
  }

  if (/\/(index|main|app|server|client)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(normalized)) {
    score += 65;
  }

  if (/\/(routes|components|lib|utils|docs)\//.test(normalized)) {
    score += 20;
  }

  if (/\.(png|jpg|jpeg|gif|svg|lock|woff2|ico)$/i.test(normalized)) {
    return 0;
  }

  if (/node_modules|dist|build|coverage|\.next|vendor|target/.test(normalized)) {
    return 0;
  }

  return score;
}

async function fetchRepositoryFiles(
  owner: string,
  repo: string,
  defaultBranch: string,
  paths: string[],
) {
  const fetchedFiles = await Promise.all(
    paths.map(async (path) => {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(defaultBranch)}`,
        {
          headers: buildGitHubHeaders(),
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        return null;
      }

      const contentData = (await response.json()) as {
        encoding?: string;
        content?: string;
        size?: number;
      };

      if (contentData.encoding !== "base64" || !contentData.content) {
        return null;
      }

      const decodedContent = Buffer.from(
        contentData.content.replace(/\n/g, ""),
        "base64",
      ).toString("utf8");

      return {
        path,
        content: truncateContent(decodedContent),
        size: contentData.size || decodedContent.length,
      } satisfies InspectedRepoFile;
    }),
  );

  return fetchedFiles.filter((file): file is InspectedRepoFile => Boolean(file));
}

function buildRepositorySummary(
  repository: GitHubRepositoryDetails,
  files: InspectedRepoFile[],
  analysis: RepositoryAnalysis,
) {
  const lines = [
    `Repository: ${repository.owner}/${repository.name}`,
    `Repository URL: ${repository.htmlUrl}`,
    `Description: ${repository.description || "No repository description provided."}`,
    `Primary language: ${repository.primaryLanguage || "Unknown"}`,
    `License: ${repository.license || "Unknown"}`,
    `Topics: ${repository.topics.length ? repository.topics.join(", ") : "None listed"}`,
    `Package manager: ${analysis.packageManager}`,
    `Install command: ${analysis.installCommand}`,
    `Frameworks: ${analysis.frameworks.join(", ") || "None confidently identified"}`,
    `Entry points: ${analysis.entryPoints.join(", ") || "No obvious app entry points found"}`,
    `Environment examples: ${analysis.envFiles.join(", ") || "None found"}`,
    `Key directories: ${analysis.keyDirectories.join(", ") || "None identified"}`,
    `Test strategy: ${analysis.testStrategy}`,
    "",
    "Detected scripts:",
    ...(analysis.scripts.length
      ? analysis.scripts.map(
          (script) => `- ${script.name}: ${script.command} (${script.description})`,
        )
      : ["- No runnable scripts were detected in inspected files."]),
    "",
    "Relevant repository files:",
  ];

  for (const file of files) {
    lines.push(`- ${file.path}`);
    lines.push("```");
    lines.push(file.content);
    lines.push("```");
  }

  return lines.join("\n");
}

function analyzeRepository(
  repository: GitHubRepositoryDetails,
  files: InspectedRepoFile[],
): RepositoryAnalysis {
  const fileMap = new Map(files.map((file) => [file.path.toLowerCase(), file]));
  const packageJsonFile = fileMap.get("package.json");
  const packageJson = packageJsonFile ? safeJsonParse(packageJsonFile.content) : null;
  const scriptsRecord = toStringRecord(packageJson?.scripts);
  const dependencies = Object.keys(toStringRecord(packageJson?.dependencies));
  const devDependencies = Object.keys(toStringRecord(packageJson?.devDependencies));
  const filePaths = files.map((file) => file.path);
  const packageManager = detectPackageManager(filePaths, packageJson?.packageManager);
  const scripts = Object.entries(scriptsRecord).map(([name, command]) => ({
    name,
    command,
    description: describeScript(name, command),
  }));
  const frameworks = detectFrameworks({
    repository,
    filePaths,
    dependencies,
    devDependencies,
  });
  const envFiles = filePaths.filter((path) =>
    /(^|\/)\.env(\..+)?(\.example)?$/i.test(path),
  );
  const configFiles = filePaths.filter((path) =>
    /(next\.config|vite\.config|tsconfig|docker-compose|dockerfile|pyproject\.toml|requirements\.txt|cargo\.toml|go\.mod|pom\.xml|build\.gradle)/i.test(
      path,
    ),
  );
  const docsFiles = filePaths.filter((path) =>
    /(^|\/)(readme|contributing|docs|architecture|changelog|license)/i.test(path),
  );
  const keyDirectories = Array.from(
    new Set(
      filePaths
        .map((path) => path.split("/")[0])
        .filter((segment) =>
          /^(app|src|pages|components|lib|utils|server|client|docs|public|tests?|examples?)$/i.test(
            segment,
          ),
        ),
    ),
  );
  const entryPoints = filePaths.filter((path) =>
    /(^|\/)(main|index|app|server|client|manage)\.(ts|tsx|js|jsx|py|go|rs)$/i.test(
      path,
    ),
  );
  const existingReadme =
    fileMap.get("readme.md")?.content ||
    fileMap.get("readme.mdx")?.content ||
    fileMap.get("readme.txt")?.content ||
    "";

  return {
    packageManager,
    installCommand: installCommandFor(packageManager),
    scripts,
    dependencies,
    devDependencies,
    frameworks,
    envFiles,
    configFiles,
    docsFiles,
    keyDirectories,
    entryPoints,
    testStrategy: detectTestStrategy(scripts, dependencies, devDependencies),
    existingReadme: truncateContent(existingReadme),
  };
}

function safeJsonParse(content: string) {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toStringRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function detectPackageManager(paths: string[], declaredPackageManager: unknown) {
  const normalizedPaths = paths.map((path) => path.toLowerCase());

  if (typeof declaredPackageManager === "string") {
    if (declaredPackageManager.startsWith("pnpm")) {
      return "pnpm";
    }
    if (declaredPackageManager.startsWith("yarn")) {
      return "yarn";
    }
    if (declaredPackageManager.startsWith("bun")) {
      return "bun";
    }
    if (declaredPackageManager.startsWith("npm")) {
      return "npm";
    }
  }

  if (normalizedPaths.includes("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (normalizedPaths.includes("yarn.lock")) {
    return "yarn";
  }
  if (normalizedPaths.includes("bun.lockb")) {
    return "bun";
  }
  if (normalizedPaths.includes("package-lock.json") || normalizedPaths.includes("package.json")) {
    return "npm";
  }
  if (normalizedPaths.includes("requirements.txt") || normalizedPaths.includes("pyproject.toml")) {
    return "pip";
  }
  if (normalizedPaths.includes("cargo.toml")) {
    return "cargo";
  }
  if (normalizedPaths.includes("go.mod")) {
    return "go";
  }

  return "unknown";
}

function installCommandFor(packageManager: RepositoryAnalysis["packageManager"]) {
  switch (packageManager) {
    case "pnpm":
      return "pnpm install";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    case "pip":
      return "pip install -r requirements.txt";
    case "cargo":
      return "cargo build";
    case "go":
      return "go mod download";
    case "npm":
      return "npm install";
    default:
      return "Install the project dependencies using the package manager defined by the repository.";
  }
}

function describeScript(name: string, command: string) {
  const normalizedName = name.toLowerCase();
  const normalizedCommand = command.toLowerCase();

  if (normalizedName === "dev" || normalizedCommand.includes("dev")) {
    return "Starts the local development workflow.";
  }
  if (normalizedName === "build" || normalizedCommand.includes("build")) {
    return "Builds the project for production or distribution.";
  }
  if (normalizedName === "start" || normalizedCommand.includes("start")) {
    return "Runs the built application.";
  }
  if (normalizedName.includes("test") || normalizedCommand.includes("test")) {
    return "Runs the automated test suite.";
  }
  if (normalizedName.includes("lint") || normalizedCommand.includes("lint")) {
    return "Checks code quality or style rules.";
  }

  return "Repository-defined project script.";
}

function detectFrameworks({
  repository,
  filePaths,
  dependencies,
  devDependencies,
}: {
  repository: GitHubRepositoryDetails;
  filePaths: string[];
  dependencies: string[];
  devDependencies: string[];
}) {
  const combined = new Set(
    [...dependencies, ...devDependencies, repository.primaryLanguage]
      .map((entry) => entry?.toLowerCase().trim())
      .filter(Boolean) as string[],
  );
  const frameworks = new Set<string>();

  const dependencyLabels: Array<[string, string]> = [
    ["next", "Next.js"],
    ["react", "React"],
    ["vue", "Vue"],
    ["svelte", "Svelte"],
    ["angular", "Angular"],
    ["express", "Express"],
    ["fastify", "Fastify"],
    ["nestjs", "NestJS"],
    ["tailwindcss", "Tailwind CSS"],
    ["typescript", "TypeScript"],
    ["prisma", "Prisma"],
    ["mongoose", "Mongoose"],
    ["jest", "Jest"],
    ["vitest", "Vitest"],
    ["playwright", "Playwright"],
    ["cypress", "Cypress"],
  ];

  for (const [dependency, label] of dependencyLabels) {
    if (combined.has(dependency)) {
      frameworks.add(label);
    }
  }

  for (const topic of repository.topics) {
    frameworks.add(formatTopic(topic));
  }

  if (filePaths.some((path) => /^app\//i.test(path))) {
    frameworks.add("App Router structure");
  }

  return Array.from(frameworks);
}

function detectTestStrategy(
  scripts: RepositoryAnalysis["scripts"],
  dependencies: string[],
  devDependencies: string[],
) {
  const combined = new Set([...dependencies, ...devDependencies].map((entry) => entry.toLowerCase()));
  const testScripts = scripts.filter((script) => script.name.toLowerCase().includes("test"));

  if (combined.has("vitest")) {
    return "Vitest-based automated tests appear to be configured.";
  }
  if (combined.has("jest")) {
    return "Jest-based automated tests appear to be configured.";
  }
  if (combined.has("playwright")) {
    return "Playwright end-to-end tests appear to be configured.";
  }
  if (combined.has("cypress")) {
    return "Cypress end-to-end tests appear to be configured.";
  }
  if (testScripts.length) {
    return `Repository scripts include test commands: ${testScripts.map((script) => script.name).join(", ")}.`;
  }

  return "No explicit automated test setup was confidently identified from the inspected files.";
}

function formatTopic(topic: string) {
  return topic
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function truncateContent(content: string) {
  const trimmed = content.trim();

  if (trimmed.length <= 2_500) {
    return trimmed;
  }

  return `${trimmed.slice(0, 2_500)}\n\n[truncated]`;
}

function encodePath(path: string) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildGitHubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "readme-generator",
  };
}

function sanitize(value: string | null | undefined) {
  return value?.trim() || "";
}
