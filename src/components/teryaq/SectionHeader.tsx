import type { ReactNode } from "react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-bold text-muted-foreground">{title}</h2>
      {action}
    </div>
  );
}