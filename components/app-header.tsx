import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="w-full">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-7 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2">
          <Image src="/icon.svg" alt="ReadGen logo" width={24} height={24} priority />
          <p className="flex items-center text-[1.4rem] font-bold leading-none tracking-tight text-foreground sm:text-[1.6rem]">
            ReadGen
          </p>
          <span
            className="text-[0.72rem] font-medium tracking-[0.08em] text-muted"
            style={{ fontFamily: "var(--font-space-mono), monospace" }}
          >
            v1.0
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
