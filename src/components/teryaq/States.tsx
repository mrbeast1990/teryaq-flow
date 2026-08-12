import { Inbox, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ActionButton } from "./ActionButton";

export function EmptyState({
  title = "لا توجد بيانات",
  description,
  icon: Icon = Inbox,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-[13px] font-bold">{title}</p>
      {description ? (
        <p className="max-w-xs text-[12px] text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card-surface h-14 animate-pulse bg-secondary/60" />
      ))}
    </div>
  );
}

export function ErrorState({
  title = "تعذر تحميل البيانات",
  description,
  onRetry,
}: {
  title?: string;
  description?: string | null | undefined;
  onRetry?: () => void;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </span>
      <p className="text-[13px] font-bold">{title}</p>
      {description ? (
        <p className="max-w-xs text-[12px] text-muted-foreground">{description}</p>
      ) : null}
      {onRetry ? (
        <ActionButton label="إعادة المحاولة" onClick={onRetry} variant="outline" />
      ) : null}
    </div>
  );
}