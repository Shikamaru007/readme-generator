"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export type Mode = "github" | "manual";

export type GeneratorFormData = {
  projectName: string;
  description: string;
  installation: string;
  usage: string;
  techStack: string;
  license: string;
  author: string;
  repositoryUrl: string;
};

type GeneratorInputPanelProps = {
  mode: Mode;
  formData: GeneratorFormData;
  onModeChange: (mode: Mode) => void;
  onFormDataChange: (formData: GeneratorFormData) => void;
  onGenerate: () => void | Promise<void>;
  onClear: () => void;
  isGenerating: boolean;
};

export function GeneratorInputPanel({
  mode,
  formData,
  onModeChange,
  onFormDataChange,
  onGenerate,
  onClear,
  isGenerating,
}: GeneratorInputPanelProps) {
  const updateField = <K extends keyof GeneratorFormData>(
    key: K,
    value: GeneratorFormData[K],
  ) => {
    onFormDataChange({
      ...formData,
      [key]: value,
    });
  };

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate();
      }}
    >
      <Tabs
        value={mode}
        onValueChange={(value) => onModeChange(value as Mode)}
        className="mb-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <TabsList>
            <TabsTrigger
              value="github"
              className="w-10 px-0"
              aria-label="Generate from GitHub"
              title="Generate from GitHub"
            >
              <GitHubIcon />
              <span className="sr-only">GitHub</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="w-10 px-0"
              aria-label="Manual entry"
              title="Manual entry"
            >
              <ManualEntryIcon />
              <span className="sr-only">Manual</span>
            </TabsTrigger>
          </TabsList>
          <p className="text-xs leading-5 text-muted">
            {mode === "github"
              ? "Use a public repository as the source."
              : "Write the project details yourself."}
          </p>
        </div>
        <TabsContent value="github">
          <GitHubGeneratorForm
            repositoryUrl={formData.repositoryUrl}
            onRepositoryUrlChange={(value) => updateField("repositoryUrl", value)}
          />
        </TabsContent>
        <TabsContent value="manual">
          <ManualGeneratorForm formData={formData} onFieldChange={updateField} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3 pt-5">
        <Button
          disabled={isGenerating}
          aria-label={isGenerating ? "Generating README" : "Generate README"}
        >
          {isGenerating ? (
            <>
              <ButtonSpinner />
              <span className="sr-only">Generating README</span>
            </>
          ) : (
            "Generate README"
          )}
        </Button>
        <Button
          type="button"
          onClick={onClear}
          disabled={isGenerating}
          variant="secondary"
        >
          Clear
        </Button>
      </div>
    </form>
  );
}

function ButtonSpinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        className="opacity-20"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
    >
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.14-1.11-1.44-1.11-1.44-.91-.62.07-.61.07-.61 1 .07 1.54 1.03 1.54 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.5 9.5 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function ManualEntryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v11" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
    </svg>
  );
}

type GitHubGeneratorFormProps = {
  repositoryUrl: string;
  onRepositoryUrlChange: (value: string) => void;
};

function GitHubGeneratorForm({
  repositoryUrl,
  onRepositoryUrlChange,
}: GitHubGeneratorFormProps) {
  return (
    <div className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          GitHub repository URL
        </span>
        <Input
          type="url"
          placeholder="https://github.com/user/repository"
          value={repositoryUrl}
          onChange={(event) => onRepositoryUrlChange(event.target.value)}
        />
      </label>
      <p className="text-sm leading-6 text-muted">
        Paste a public GitHub repository URL and the generator will use the
        repository metadata as source material for the README draft.
      </p>
    </div>
  );
}

type ManualGeneratorFormProps = {
  formData: GeneratorFormData;
  onFieldChange: <K extends keyof GeneratorFormData>(
    key: K,
    value: GeneratorFormData[K],
  ) => void;
};

function ManualGeneratorForm({
  formData,
  onFieldChange,
}: ManualGeneratorFormProps) {
  return (
    <div className="grid gap-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Project name</span>
        <Input
          placeholder="My project"
          value={formData.projectName}
          onChange={(event) => onFieldChange("projectName", event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <Textarea
          placeholder="Describe what the project does and who it is for."
          value={formData.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className="min-h-28"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Installation</span>
        <Textarea
          placeholder="How should users install the project?"
          value={formData.installation}
          onChange={(event) => onFieldChange("installation", event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Usage</span>
        <Textarea
          placeholder="Explain how to use the project."
          value={formData.usage}
          onChange={(event) => onFieldChange("usage", event.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Tech stack</span>
        <Input
          placeholder="Next.js, TypeScript, Tailwind CSS"
          value={formData.techStack}
          onChange={(event) => onFieldChange("techStack", event.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">License</span>
          <Input
            placeholder="MIT"
            value={formData.license}
            onChange={(event) => onFieldChange("license", event.target.value)}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Author name</span>
          <Input
            placeholder="Your name"
            value={formData.author}
            onChange={(event) => onFieldChange("author", event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
