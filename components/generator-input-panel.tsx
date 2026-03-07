"use client";

import { useState } from "react";

const fieldClassName =
  "w-full rounded-2xl border border-border bg-[#fcfaf6] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-[rgba(109,40,217,0.12)]";

type Mode = "github" | "manual";

export function GeneratorInputPanel() {
  const [mode, setMode] = useState<Mode>("github");

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 inline-flex w-fit items-center gap-1 rounded-full border border-[#e8e4dc] bg-[#f3f0ea] p-1.5">
        <button
          type="button"
          onClick={() => setMode("github")}
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
          onClick={() => setMode("manual")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "manual"
              ? "bg-white text-foreground ring-1 ring-[rgba(109,40,217,0.12)]"
              : "text-muted hover:bg-white/60 hover:text-foreground"
          }`}
        >
          Manual Generator
        </button>
      </div>

      {mode === "github" ? <GitHubGeneratorForm /> : <ManualGeneratorForm />}

      <div className="flex flex-wrap gap-3 pt-5">
        <button className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:brightness-105">
          Generate README
        </button>
        <button className="rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent">
          Clear
        </button>
      </div>
    </div>
  );
}

function GitHubGeneratorForm() {
  return (
    <div className="space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          GitHub repository URL
        </span>
        <input
          type="url"
          placeholder="https://github.com/user/repository"
          className={fieldClassName}
        />
      </label>
    </div>
  );
}

function ManualGeneratorForm() {
  return (
    <div className="grid gap-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Project name</span>
        <input type="text" placeholder="My project" className={fieldClassName} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Description</span>
        <textarea
          placeholder="Describe what the project does and who it is for."
          className={`${fieldClassName} min-h-28`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Installation</span>
        <textarea
          placeholder="How should users install the project?"
          className={`${fieldClassName} min-h-24`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Usage</span>
        <textarea
          placeholder="Explain how to use the project."
          className={`${fieldClassName} min-h-24`}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">Tech stack</span>
        <input
          type="text"
          placeholder="Next.js, TypeScript, Tailwind CSS"
          className={fieldClassName}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">License</span>
          <input type="text" placeholder="MIT" className={fieldClassName} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Author name</span>
          <input type="text" placeholder="Your name" className={fieldClassName} />
        </label>
      </div>
    </div>
  );
}
