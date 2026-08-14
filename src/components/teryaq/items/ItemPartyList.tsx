import { EmptyState } from "../States";

export interface ItemPartyRow {
  id?: string | number;
  name?: string | null;
  quantity?: string | null;
  lastDate?: string | null;
  total?: number | null;
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function ItemPartyList({
  rows = [],
  emptyTitle,
  emptyDescription,
  totalLabel,
}: {
  rows?: ItemPartyRow[];
  emptyTitle: string;
  emptyDescription: string;
  totalLabel: string;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={row.id ?? index} className="card-surface flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold">{row.name || "-"}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {row.lastDate || "-"}
              {row.quantity ? ` · الكمية: ${row.quantity}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-left">
            <p className="num text-[13px] font-extrabold">{formatCurrency(row.total)}</p>
            <p className="text-[11px] text-muted-foreground">{totalLabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
