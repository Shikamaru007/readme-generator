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
    <section className="flex min-h-[420px] flex-col rounded-[28px] bg-white p-6 sm:p-7">
      <div className="mb-5 space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="max-w-xl text-sm leading-5.5 text-muted">{description}</p>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}
