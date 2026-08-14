export interface ItemMovementRowProps {
  date?: string | null | undefined;
  title?: string | null | undefined;
  subtitle?: string | null | undefined;
  quantity?: string | null | undefined;
  amount?: number | null | undefined;
  amountLabel?: string;
  onClick?: (() => void) | undefined;
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function ItemMovementRow({
  date,
  title,
  subtitle,
  quantity,
  amount,
  amountLabel = "الإجمالي",
  onClick,
}: ItemMovementRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card-surface w-full p-3 text-right ${onClick ? "transition-colors hover:bg-secondary/50" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold">{title || "-"}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {date || "-"}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p className="num text-[13px] font-extrabold">{formatCurrency(amount)}</p>
          <p className="text-[11px] text-muted-foreground">{amountLabel}</p>
        </div>
      </div>
      {quantity ? (
        <div className="mt-2 rounded-lg bg-secondary/50 px-2 py-1 text-[12px]">
          <span className="text-muted-foreground">الكمية: </span>
          <span className="num font-bold">{quantity}</span>
        </div>
      ) : null}
    </button>
  );
}
