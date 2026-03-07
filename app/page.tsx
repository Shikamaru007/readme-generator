import { AppHeader } from "@/components/app-header";
import { WorkspacePanel } from "@/components/workspace-panel";

export default function Home() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-8 pb-14 pt-8 sm:px-14 lg:px-24 xl:px-32">
        <div className="mx-auto max-w-5xl">
          <section className="grid gap-5 lg:grid-cols-2">
            <WorkspacePanel
              eyebrow="Input"
              title="Project details"
              description="Capture the core information needed to generate a README. Keep inputs structured and concise for cleaner output."
            >
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Project name
                  </span>
                  <input
                    type="text"
                    placeholder="My project"
                    className="w-full rounded-2xl border border-border bg-[#fcfaf6] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-[rgba(109,40,217,0.12)]"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Short description
                  </span>
                  <textarea
                    placeholder="Describe what the project does and who it is for."
                    className="min-h-48 w-full rounded-2xl border border-border bg-[#fcfaf6] px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-[rgba(109,40,217,0.12)]"
                  />
                </label>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white transition hover:brightness-105">
                    Generate README
                  </button>
                  <button className="rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent">
                    Clear
                  </button>
                </div>
              </div>
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
                      Untitled README
                    </p>
                    <p className="text-xs text-muted">Live markdown preview</p>
                  </div>
                  <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-accent">
                    Preview
                  </span>
                </div>
                <div
                  className="space-y-4 text-sm leading-7 text-[#3f3a35]"
                  style={{ fontFamily: "var(--font-space-mono), monospace" }}
                >
                  <p># Project title</p>
                  <p>
                    A short summary will appear here once the input form is filled
                    out and the README is generated.
                  </p>
                  <p>## Features</p>
                  <p>- Clear project overview</p>
                  <p>- Setup instructions</p>
                  <p>- Usage examples</p>
                  <p>## Installation</p>
                  <p>```bash</p>
                  <p>npm install</p>
                  <p>npm run dev</p>
                  <p>```</p>
                </div>
              </div>
            </WorkspacePanel>
          </section>
        </div>
      </main>
    </div>
  );
}
