import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "outline" | "ghost";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-card text-foreground hover:bg-secondary",
  ghost: "text-muted-foreground hover:bg-secondary",
};

export function ActionButton({
  label,
  icon: Icon,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT[variant]}`}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {label}
    </button>
  );
}
