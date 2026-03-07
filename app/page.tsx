import { AppHeader } from "@/components/app-header";
import { GeneratorInputPanel } from "@/components/generator-input-panel";
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
              description="Choose a source mode, then fill in the repository link or the manual project details needed for README generation."
            >
              <GeneratorInputPanel />
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
                  className="space-y-3 text-[0.84rem] leading-6 text-[#3f3a35]"
                  style={{ fontFamily: "var(--font-space-mono), monospace" }}
                >
                  <p># Project Name</p>
                  <p>## Description</p>
                  <p>
                    A concise overview of the project will appear here after the
                    generator is filled out.
                  </p>
                  <p>## Installation</p>
                  <p>Step-by-step setup instructions will be inserted here.</p>
                  <p>## Usage</p>
                  <p>Usage guidance and examples will appear in this section.</p>
                  <p>## Tech Stack</p>
                  <p>Frameworks, libraries, and tooling will be listed here.</p>
                  <p>## License</p>
                  <p>License details will appear here.</p>
                  <p>## Author</p>
                  <p>Author information will appear here.</p>
                </div>
              </div>
            </WorkspacePanel>
          </section>
        </div>
      </main>
    </div>
  );
}
