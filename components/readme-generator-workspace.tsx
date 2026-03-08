"use client";

import { useState } from "react";
import {
  GeneratorInputPanel,
  type GeneratorFormData,
  type Mode,
} from "@/components/generator-input-panel";
import { WorkspacePanel } from "@/components/workspace-panel";

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

const INITIAL_PREVIEW = [
  "# Project Name",
  "",
  "## Description",
  "",
  "Click **Generate README** to create a draft from a GitHub repository or the manual project details you provide.",
  "",
  "## Installation",
  "",
  "Installation steps will be generated here.",
  "",
  "## Usage",
  "",
  "Usage guidance will be generated here.",
].join("\n");

export function ReadmeGeneratorWorkspace() {
  const [mode, setMode] = useState<Mode>("github");
  const [formData, setFormData] = useState<GeneratorFormData>(EMPTY_FORM_DATA);
  const [generatedReadme, setGeneratedReadme] = useState(INITIAL_PREVIEW);
  const [previewTitle, setPreviewTitle] = useState("Untitled README");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/generate-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          formData,
        }),
      });

      if (!response.ok) {
        throw new Error("README generation failed");
      }

      const data = (await response.json()) as {
        markdown: string;
        projectName: string;
      };

      setGeneratedReadme(data.markdown);
      setPreviewTitle(data.projectName || "Untitled README");
    } catch {
      setErrorMessage(
        "The README could not be generated right now. Check the repository URL or try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setMode("github");
    setFormData(EMPTY_FORM_DATA);
    setGeneratedReadme(INITIAL_PREVIEW);
    setPreviewTitle("Untitled README");
    setErrorMessage("");
  };

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <WorkspacePanel
        eyebrow="Input"
        title="Project details"
        description="Choose a source mode, then provide a repository URL or a few project details for the README generator to work from."
      >
        <GeneratorInputPanel
          mode={mode}
          formData={formData}
          onModeChange={setMode}
          onFormDataChange={setFormData}
          onGenerate={handleGenerate}
          onClear={handleClear}
          isGenerating={isGenerating}
        />
      </WorkspacePanel>
      <WorkspacePanel
        eyebrow="Preview"
        title="README preview"
        description="The preview shows generated markdown based on GitHub metadata or the manual details currently provided."
      >
        <div className="flex h-full flex-1 flex-col rounded-3xl border border-dashed border-border bg-[#fcfaf6] p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {previewTitle}
              </p>
              <p className="text-xs text-muted">
                {isGenerating ? "Generating README..." : "Generated markdown preview"}
              </p>
            </div>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-accent">
              {mode === "github" ? "GitHub source" : "Manual source"}
            </span>
          </div>
          {errorMessage ? (
            <p className="mb-4 rounded-2xl border border-[#efc5c5] bg-[#fff2f2] px-4 py-3 text-sm text-[#9a3b3b]">
              {errorMessage}
            </p>
          ) : null}
          <pre
            className="min-h-80 flex-1 overflow-auto rounded-2xl border border-[#e8e4dc] bg-white p-4 text-[0.84rem] leading-6 text-[#3f3a35] whitespace-pre-wrap break-all shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            {generatedReadme}
          </pre>
        </div>
      </WorkspacePanel>
    </section>
  );
 }
