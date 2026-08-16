import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getInventory, ApiError, type ItemInfo } from "@/lib/api";
import { OutOfStockRow } from "@/components/teryaq/items/OutOfStockRow";

const PAGE_SIZE = 100;

export const Route = createFileRoute("/items/out-of-stock")({
  head: () => ({
    meta: [{ title: "أصناف نفدت — Teryaq" }],
  }),
  component: OutOfStockPage,
});

function exportOutOfStock(rows: ItemInfo[]) {
  if (!rows.length) {
    window.alert("لا توجد بيانات للتصدير.");
    return;
  }
  const headers = ["اسم الصنف", "الكود", "الباركود", "آخر شراء", "آخر بيع", "آخر مورد", "سعر الشراء الأخير", "سعر البيع الأخير"];
  const lines = rows.map((row) => [
    row.name || "",
    row.code || "",
    row.barcode || "",
    row.lastPurchaseDate || "",
    row.lastSaleDate || "",
    row.lastSupplier || "",
    String(row.purchasePrice ?? ""),
    String(row.salePrice ?? ""),
  ]);
  const csv = [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `out-of-stock-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function OutOfStockPage() {
  const [page, setPage] = useState(1);
  const [loadedItems, setLoadedItems] = useState<ItemInfo[]>([]);

  const query = useQuery({
    queryKey: ["inventory-out-of-stock", page, PAGE_SIZE],
    queryFn: () => getInventory({ filter: "out-of-stock", page, pageSize: PAGE_SIZE }),
  });

  useEffect(() => {
    if (!query.data?.rows) return;
    setLoadedItems((current) => {
      if (page === 1) return query.data.rows;
      const existingIds = new Set(current.map((item) => item.id));
      const nextRows = query.data.rows.filter((item) => !existingIds.has(item.id));
      return nextRows.length ? [...current, ...nextRows] : current;
    });
  }, [query.data, page]);

  const items = loadedItems;
  const totalCount = query.data?.totalCount ?? items.length;
  const hasMore = Boolean(query.data?.hasMore);
  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="أصناف نفدت"
        showBack
        actions={
          <div className="flex gap-1">
            <ActionButton label="تصدير" icon={FileDown} variant="outline" disabled={!items.length} onClick={() => exportOutOfStock(items)} />
            <ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />
          </div>
        }
      />

      <div className="mt-2 min-h-[50vh]">
        {query.isLoading ? (
          <LoadingState rows={6} />
        ) : query.isError ? (
          <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
        ) : !items.length ? (
          <EmptyState
            title="لا توجد أصناف نفدت"
            description="جميع الأصناف المتوفرة لديها رصيد حاليًا."
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[12px] text-muted-foreground">
              يعرض {items.length} من {totalCount} صنف
            </p>
            {items.map((item) => (
              <OutOfStockRow
                key={item.id}
                name={item.name}
                code={item.code == null ? null : String(item.code)}
                barcode={item.barcode}
                formattedQuantity={item.formattedQuantity}
                purchasePrice={item.purchasePrice}
                salePrice={item.salePrice}
              />
            ))}
            {hasMore ? (
              <ActionButton
                label={query.isFetching ? "جاري التحميل..." : "تحميل المزيد"}
                variant="outline"
                disabled={query.isFetching}
                onClick={() => setPage((current) => current + 1)}
              />
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
