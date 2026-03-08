import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <CardTitle className="sm:text-[1.35rem]">
          {title}
        </CardTitle>
        <CardDescription className="max-w-xl">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
    </Card>
  );
}
