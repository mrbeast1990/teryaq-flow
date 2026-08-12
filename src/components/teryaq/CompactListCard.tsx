import { ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = {
  title: string;
  subtitle?: string;
  value?: string;
  meta?: string;
  icon?: LucideIcon;
  to?: string;
};

export function CompactListCard({ title, subtitle, value, meta, icon: Icon, to }: Props) {
  const content = (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
      {Icon ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
          <Icon className="size-4" />
        </span>
      ) : (
        <span />
      )}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold">{title}</p>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-left">
        {value ? <p className="num text-[13px] font-extrabold">{value}</p> : null}
        {meta ? <p className="text-[11px] text-muted-foreground">{meta}</p> : null}
        {!value && !meta && to ? <ChevronLeft className="size-4 text-muted-foreground" /> : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="card-surface block cursor-pointer touch-manipulation transition-colors hover:bg-secondary/50 active:scale-[0.99] active:bg-secondary/70"
      >
        {content}
      </Link>
    );
  }
  return <div className="card-surface">{content}</div>;
}
