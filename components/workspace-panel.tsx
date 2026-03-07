import type { ReactNode } from "react";

type WorkspacePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function WorkspacePanel({
  eyebrow,
  title,
  description,
  children,
}: WorkspacePanelProps) {
  return (
    <section className="flex min-h-[420px] flex-col rounded-[28px] p-6 sm:p-7">
      <div className="mb-4 space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.35rem]">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-5.5 text-muted">{description}</p>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}
