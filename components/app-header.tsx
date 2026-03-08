import Image from "next/image";

export function AppHeader() {
  return (
    <header className="w-full">
      <div className="flex w-full items-center gap-2 px-6 py-7 sm:px-8 lg:px-10">
        <Image src="/icon.svg" alt="ReadGen logo" width={24} height={24} priority />
        <p className="flex items-center text-[1.4rem] font-bold leading-none tracking-tight text-foreground sm:text-[1.6rem]">
          ReadGen
        </p>
      </div>
    </header>
  );
}
