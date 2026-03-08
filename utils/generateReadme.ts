export type ReadmeProjectData = {
  projectName: string;
  description: string;
  installation: string;
  usage: string;
  techStack: string;
  license: string;
  author: string;
};

const SECTION_FIELDS: Array<{
  title: string;
  key: Exclude<keyof ReadmeProjectData, "projectName">;
}> = [
  { title: "Description", key: "description" },
  { title: "Installation", key: "installation" },
  { title: "Usage", key: "usage" },
  { title: "Tech Stack", key: "techStack" },
  { title: "License", key: "license" },
  { title: "Author", key: "author" },
];

export function generateReadme({
  projectName,
  description,
  installation,
  usage,
  techStack,
  license,
  author,
}: ReadmeProjectData): string {
  const normalizedProjectName = projectName.trim() || "Untitled Project";
  const contentByField: Omit<ReadmeProjectData, "projectName"> = {
    description,
    installation,
    usage,
    techStack,
    license,
    author,
  };
  const sections = [
    `# ${normalizedProjectName}`,
    ...SECTION_FIELDS.map(({ title, key }) =>
      createSection(title, contentByField[key]),
    ).filter(Boolean),
  ];

  return sections.join("\n\n").trim();
}

function createSection(title: string, content: string): string | null {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    return null;
  }

  return `## ${title}\n\n${normalizedContent}`;
}
