"use client";

const fieldClassName =
  "w-full rounded-2xl border border-border bg-[#fcfaf6] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-[rgba(109,40,217,0.12)]";

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
  onGenerate: () => void;
  onClear: () => void;
};

export function GeneratorInputPanel({
  mode,
  formData,
  onModeChange,
  onFormDataChange,
  onGenerate,
  onClear,
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
      <div className="mb-5 inline-flex w-fit items-center gap-1 rounded-full border border-[#e8e4dc] bg-[#f3f0ea] p-1.5">
        <button
          type="button"
          onClick={() => onModeChange("github")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "github"
              ? "bg-white text-foreground ring-1 ring-[rgba(109,40,217,0.12)]"
              : "text-muted hover:bg-white/60 hover:text-foreground"
          }`}
        >
          Generate from GitHub
        </button>
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-white text-foreground ring-1 ring-[rgba(109,40,217,0.12)]"
              : "text-muted hover:bg-white/60 hover:text-foreground"
          }`}
        >
          Manual Generator
        </button>
      </div>

      {mode === "github" ? (
        <GitHubGeneratorForm
          repositoryUrl={formData.repositoryUrl}
          onRepositoryUrlChange={(value) => updateField("repositoryUrl", value)}
        />
      ) : (
        <ManualGeneratorForm formData={formData} onFieldChange={updateField} />
      )}

      <div className="flex flex-wrap gap-3 pt-5">
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:brightness-105"
        >
          Generate README
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Clear
        </button>
      </div>
    </form>
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
        <input
          type="url"
          placeholder="https://github.com/user/repository"
          value={repositoryUrl}
          onChange={(event) => onRepositoryUrlChange(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <p className="text-sm leading-6 text-muted">
        GitHub import is not connected yet, so the preview uses manual project
        details when you generate the README.
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
        <input
          type="text"
          placeholder="My project"
          value={formData.projectName}
          onChange={(event) => onFieldChange("projectName", event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          placeholder="Describe what the project does and who it is for."
          value={formData.description}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className={`${fieldClassName} min-h-28`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Installation</span>
        <textarea
          placeholder="How should users install the project?"
          value={formData.installation}
          onChange={(event) => onFieldChange("installation", event.target.value)}
          className={`${fieldClassName} min-h-24`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Usage</span>
        <textarea
          placeholder="Explain how to use the project."
          value={formData.usage}
          onChange={(event) => onFieldChange("usage", event.target.value)}
          className={`${fieldClassName} min-h-24`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Tech stack</span>
        <input
          type="text"
          placeholder="Next.js, TypeScript, Tailwind CSS"
          value={formData.techStack}
          onChange={(event) => onFieldChange("techStack", event.target.value)}
          className={fieldClassName}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">License</span>
          <input
            type="text"
            placeholder="MIT"
            value={formData.license}
            onChange={(event) => onFieldChange("license", event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Author name</span>
          <input
            type="text"
            placeholder="Your name"
            value={formData.author}
            onChange={(event) => onFieldChange("author", event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>
    </div>
  );
}
