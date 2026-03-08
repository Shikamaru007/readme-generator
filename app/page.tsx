import { AppHeader } from "@/components/app-header";
import { ReadmeGeneratorWorkspace } from "@/components/readme-generator-workspace";

export default function Home() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="px-8 pb-14 pt-8 sm:px-14 lg:px-24 xl:px-32">
        <div className="mx-auto max-w-5xl">
          <ReadmeGeneratorWorkspace />
        </div>
      </main>
    </div>
  );
}
