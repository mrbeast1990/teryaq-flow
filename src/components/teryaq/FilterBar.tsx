import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
      {children}
    </div>
  );
}

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}