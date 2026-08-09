import type { LucideIcon } from "lucide-react";

export type KpiTone = "default" | "success" | "warning" | "danger" | "info";

const TONE: Record<KpiTone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function KPICard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  icon: LucideIcon;
  tone?: KpiTone | undefined;
}) {
  return (
    <div className="card-surface flex flex-col gap-1.5 p-3">
      <div className="flex items-center gap-2">
        <span className={`grid size-7 shrink-0 place-items-center rounded-md ${TONE[tone]}`}>
          <Icon className="size-[15px]" />
        </span>
        <span className="min-w-0 truncate text-[12px] font-semibold text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="num truncate text-[19px] font-extrabold leading-tight">{value}</p>
      {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}