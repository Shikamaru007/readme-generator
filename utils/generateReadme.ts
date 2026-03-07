export type ReadmeProjectData = {
  projectName: string;
  description: string;
  installation: string;
  usage: string;
  techStack: string;
  license: string;
  author: string;
};

export function generateReadme({
  projectName,
  description,
  installation,
  usage,
  techStack,
  license,
  author,
}: ReadmeProjectData): string {
  const sections = [
    `# ${projectName.trim()}`,
    createSection("Description", description),
    createSection("Installation", installation),
    createSection("Usage", usage),
    createSection("Tech Stack", techStack),
    createSection("License", license),
    createSection("Author", author),
  ];

  return sections.join("\n\n").trim();
}

function createSection(title: string, content: string): string {
  return `## ${title}\n\n${content.trim()}`;
}
