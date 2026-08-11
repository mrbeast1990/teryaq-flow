import type { ReactNode } from "react";

import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
  showBack = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBack?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-3">
      {showBack && (
        <button
          onClick={() => navigate({ to: ".." })}
          className="grid size-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary"
          aria-label="Back"
        >
          <ChevronRight className="size-5" />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-extrabold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}