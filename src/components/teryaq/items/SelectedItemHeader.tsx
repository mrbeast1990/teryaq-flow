import type { ItemInfo } from "@/lib/api";

export function SelectedItemHeader({ item }: { item: ItemInfo }) {
  return (
    <div className="card-surface mb-3 p-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-primary">{item.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.code ? `كود: ${item.code}` : ""}
            {item.barcode ? ` · باركود: ${item.barcode}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p className="num text-[15px] font-extrabold">{item.formattedQuantity || "0"}</p>
          <p className="text-[11px] text-muted-foreground">الرصيد الحالي</p>
        </div>
      </div>
    </div>
  );
}
