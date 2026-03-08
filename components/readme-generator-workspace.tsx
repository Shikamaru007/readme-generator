"use client";

import { useState } from "react";
import { GeneratorInputPanel, type GeneratorFormData } from "@/components/generator-input-panel";
import { WorkspacePanel } from "@/components/workspace-panel";
import { generateReadme } from "@/utils/generateReadme";

const EMPTY_FORM_DATA: GeneratorFormData = {
  projectName: "",
  description: "",
  installation: "",
  usage: "",
  techStack: "",
  license: "",
  author: "",
  repositoryUrl: "",
};

const PREVIEW_PLACEHOLDERS = {
  description:
    "A concise overview of the project will appear here after the generator is filled out.",
  installation: "Step-by-step setup instructions will be inserted here.",
  usage: "Usage guidance and examples will appear in this section.",
  techStack: "Frameworks, libraries, and tooling will be listed here.",
  license: "License details will appear here.",
  author: "Author information will appear here.",
};

export function ReadmeGeneratorWorkspace() {
  const [mode, setMode] = useState<"github" | "manual">("github");
  const [formData, setFormData] = useState<GeneratorFormData>(EMPTY_FORM_DATA);
  const [generatedReadme, setGeneratedReadme] = useState(
    createPreviewReadme("github", EMPTY_FORM_DATA),
  );

  const handleGenerate = () => {
    setGeneratedReadme(createPreviewReadme(mode, formData));
  };

  const handleClear = () => {
    setMode("github");
    setFormData(EMPTY_FORM_DATA);
    setGeneratedReadme(createPreviewReadme("github", EMPTY_FORM_DATA));
  };

  const previewTitle = formData.projectName.trim() || "Untitled README";

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <WorkspacePanel
        eyebrow="Input"
        title="Project details"
        description="Choose a source mode, then fill in the repository link or the manual project details needed for README generation."
      >
        <GeneratorInputPanel
          mode={mode}
          formData={formData}
          onModeChange={setMode}
          onFormDataChange={setFormData}
          onGenerate={handleGenerate}
          onClear={handleClear}
        />
      </WorkspacePanel>
      <WorkspacePanel
        eyebrow="Preview"
        title="README preview"
        description="Inspect the generated markdown in a roomy preview panel before exporting or copying it into your repository."
      >
        <div className="flex h-full flex-1 flex-col rounded-3xl border border-dashed border-border bg-[#fcfaf6] p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {previewTitle}
              </p>
              <p className="text-xs text-muted">Generated markdown preview</p>
            </div>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-accent">
              Preview
            </span>
          </div>
          <pre
            className="min-h-320px flex-1 overflow-auto rounded-2xl border border-[#e8e4dc] bg-white p-4 whitespace-pre-wrap wrap-break-word text-[0.84rem] leading-6 text-[#3f3a35] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            {generatedReadme}
          </pre>
        </div>
      </WorkspacePanel>
    </section>
  );
}

function createPreviewReadme(
  mode: "github" | "manual",
  formData: GeneratorFormData,
): string {
  const hasManualContent = [
    formData.projectName,
    formData.description,
    formData.installation,
    formData.usage,
    formData.techStack,
    formData.license,
    formData.author,
  ].some((value) => value.trim().length > 0);

  if (mode === "github" && !hasManualContent) {
    return generateReadme({
      projectName: "Project Name",
      description:
        "Paste a GitHub repository URL on the left, or switch to Manual Generator to enter the project details yourself.",
      installation: PREVIEW_PLACEHOLDERS.installation,
      usage: PREVIEW_PLACEHOLDERS.usage,
      techStack: PREVIEW_PLACEHOLDERS.techStack,
      license: PREVIEW_PLACEHOLDERS.license,
      author: PREVIEW_PLACEHOLDERS.author,
    });
  }

  if (!hasManualContent) {
    return generateReadme({
      projectName: "Project Name",
      description: PREVIEW_PLACEHOLDERS.description,
      installation: PREVIEW_PLACEHOLDERS.installation,
      usage: PREVIEW_PLACEHOLDERS.usage,
      techStack: PREVIEW_PLACEHOLDERS.techStack,
      license: PREVIEW_PLACEHOLDERS.license,
      author: PREVIEW_PLACEHOLDERS.author,
    });
  }

  return generateReadme({
    projectName: formData.projectName,
    description: formData.description,
    installation: formData.installation,
    usage: formData.usage,
    techStack: formData.techStack,
    license: formData.license,
    author: formData.author,
  });
}
