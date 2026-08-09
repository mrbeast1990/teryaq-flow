export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/35 bg-warning/15 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-info/30 bg-info/10 text-info",
  neutral: "border-border bg-secondary text-muted-foreground",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}
    >
      {label}
    </span>
  );
}