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
  onClick?: (() => void) | undefined;
  actionLabel?: string | undefined;
  wrapText?: boolean | undefined;
  valueTone?: "positive" | "negative" | "neutral" | undefined;
  className?: string | undefined;
};

export function CompactListCard({ title, subtitle, value, meta, icon: Icon, to, onClick, actionLabel, wrapText, valueTone = "neutral", className = "" }: Props) {
  const titleClass = wrapText ? "line-clamp-2 whitespace-normal break-words text-[13px] font-bold leading-snug" : "truncate text-[13px] font-bold";
  const subtitleClass = wrapText ? "mt-0.5 line-clamp-2 whitespace-normal break-words text-[11px] leading-snug text-muted-foreground" : "truncate text-[11px] text-muted-foreground";
  const valueToneClass =
    valueTone === "positive" ? "text-success" : valueTone === "negative" ? "text-destructive" : "";
  const content = (
    <div className={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-3 py-2.5 ${wrapText ? "items-start" : "items-center"}`}>
      {Icon ? (
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent-foreground ${wrapText ? "mt-0.5" : ""}`}>
          <Icon className="size-4" />
        </span>
      ) : (
        <span />
      )}
      <div className="min-w-0">
        <p className={titleClass}>{title}</p>
        {subtitle ? (
          <p className={subtitleClass}>{subtitle}</p>
        ) : null}
      </div>
      <div className={`shrink-0 text-left ${wrapText ? "pt-1" : ""}`}>
        {value ? <p className={`num text-[13px] font-extrabold ${valueToneClass}`}>{value}</p> : null}
        {meta ? <p className="text-[11px] text-muted-foreground">{meta}</p> : null}
        {actionLabel ? <p className="text-[11px] font-bold text-primary">{actionLabel}</p> : null}
        {!value && !meta && (to || onClick) ? <ChevronLeft className="size-4 text-muted-foreground" /> : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`card-surface block cursor-pointer touch-manipulation transition-colors hover:bg-secondary/50 active:scale-[0.99] active:bg-secondary/70 ${className}`}
      >
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`card-surface block w-full cursor-pointer touch-manipulation text-right transition-colors hover:bg-secondary/50 active:scale-[0.99] active:bg-secondary/70 ${className}`}
      >
        {content}
      </button>
    );
  }
  return <div className={`card-surface ${className}`}>{content}</div>;
}
