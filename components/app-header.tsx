import Image from "next/image";

export function AppHeader() {
  return (
    <header className="w-full">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-6 sm:px-8 lg:px-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(17,17,17,0.06)]">
          <Image src="/icon.svg" alt="ReadGen logo" width={28} height={28} priority />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">ReadGen</p>
          <p className="text-sm text-muted">README generator workspace</p>
        </div>
      </div>
    </header>
  );
}
