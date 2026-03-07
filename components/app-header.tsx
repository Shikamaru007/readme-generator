import Image from "next/image";

export function AppHeader() {
  return (
    <header className="w-full">
      <div className="flex w-full items-center gap-2.5 px-4 py-7 sm:px-6 lg:px-8">
        <Image src="/icon.svg" alt="ReadGen logo" width={42} height={42} priority />
        <p className="flex items-center text-[1.9rem] font-extrabold leading-none tracking-tight text-foreground sm:text-[2.25rem]">
          ReadGen
        </p>
      </div>
    </header>
  );
}
