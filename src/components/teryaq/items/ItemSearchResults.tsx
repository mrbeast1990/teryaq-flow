import type { ItemInfo } from "@/lib/api";

interface Props {
  items: ItemInfo[];
  onSelect: (item: ItemInfo) => void;
}

export function ItemSearchResults({ items, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border/50">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="card-surface flex w-full items-center justify-between p-3 text-right transition-colors hover:bg-secondary/50"
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold">{item.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {item.code ? `كود: ${item.code}` : ""}
              {item.barcode ? ` · باركود: ${item.barcode}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-left">
            <p className="num text-[13px] font-bold text-primary">{item.formattedQuantity || "0"}</p>
            <p className="text-[10px] text-muted-foreground">الرصيد</p>
          </div>
        </button>
      ))}
    </div>
  );
}
