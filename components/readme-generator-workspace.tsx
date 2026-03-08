"use client";

import { type ReactNode, useState } from "react";
import {
  GeneratorInputPanel,
  type GeneratorFormData,
  type Mode,
} from "@/components/generator-input-panel";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
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
  const [noticeMessage, setNoticeMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage("");
    setNoticeMessage("");
    setCopyMessage("");

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
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(
          errorPayload.error || "The README could not be generated right now.",
        );
      }

      const data = (await response.json()) as {
        markdown: string;
        projectName: string;
        notice?: string | null;
        sourceData: {
          projectName?: string;
          description?: string;
          techStack?: string;
          license?: string;
          repositoryUrl?: string;
          author?: string;
        } | null;
      };

      setGeneratedReadme(data.markdown);
      setPreviewTitle(data.projectName || "Untitled README");
      setNoticeMessage(data.notice || "");
      if (mode === "github" && data.sourceData) {
        setFormData((currentFormData) => ({
          ...currentFormData,
          projectName: data.sourceData?.projectName || currentFormData.projectName,
          description: data.sourceData?.description || currentFormData.description,
          techStack: data.sourceData?.techStack || currentFormData.techStack,
          license: data.sourceData?.license || currentFormData.license,
          repositoryUrl:
            data.sourceData?.repositoryUrl || currentFormData.repositoryUrl,
          author: data.sourceData?.author || currentFormData.author,
        }));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The README could not be generated right now. Check the repository URL or try again.",
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
    setNoticeMessage("");
    setCopyMessage("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReadme);
      setCopyMessage("Copied to clipboard.");
    } catch {
      setCopyMessage("Unable to copy right now.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedReadme], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "README.md";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="grid items-start gap-5 lg:grid-cols-[1.1fr_1.5fr]">
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
        <div className="flex flex-col gap-3 rounded-[30px] bg-surface">
          <div className="rounded-3xl bg-surface-muted px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {previewTitle}
                </p>
                <div className="mt-0.5 text-xs font-medium leading-4 text-muted">
                  <p>
                    {isGenerating ? "Generating README..." : "Generated markdown preview"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconActionButton
                  label="Copy README"
                  onClick={handleCopy}
                  disabled={isGenerating}
                  variant="secondary"
                >
                  <CopyIcon />
                </IconActionButton>
                <IconActionButton
                  label="Download README.md"
                  onClick={handleDownload}
                  disabled={isGenerating}
                  variant="primary"
                >
                  <DownloadIcon />
                </IconActionButton>
              </div>
            </div>
          </div>
          <div className="flex flex-col rounded-[26px] bg-surface-subtle p-4">
            <div className="min-w-0">
              {copyMessage ? (
                  <p className="mb-4 text-xs font-medium leading-4 text-muted">
                    {copyMessage}
                  </p>
              ) : null}
              {errorMessage ? (
                <p className="mb-4 rounded-2xl bg-danger-surface px-4 py-3 text-sm text-danger-foreground">
                  {errorMessage}
                </p>
              ) : null}
              {noticeMessage ? (
                <p className="mb-4 rounded-2xl bg-warning-surface px-4 py-3 text-sm text-warning-foreground">
                  {noticeMessage}
                </p>
              ) : null}
              <pre
                className="min-h-80 flex-1 overflow-auto rounded-[26px] bg-editor-surface p-4 text-[0.84rem] leading-6 text-editor-foreground whitespace-pre-wrap break-all"
                style={{ fontFamily: "var(--font-space-mono), monospace" }}
              >
                {generatedReadme}
              </pre>
            </div>
          </div>
        </div>
      </WorkspacePanel>
    </section>
  );
}

type IconActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant: "primary" | "secondary";
};

function IconActionButton({
  label,
  onClick,
  disabled,
  children,
  variant,
}: IconActionButtonProps) {
  return (
    <Tooltip content={label}>
      <Button
        onClick={onClick}
        aria-label={label}
        disabled={disabled}
        type="button"
        variant={variant === "primary" ? "iconPrimary" : "icon"}
        size="icon"
      >
        {children}
      </Button>
    </Tooltip>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}
