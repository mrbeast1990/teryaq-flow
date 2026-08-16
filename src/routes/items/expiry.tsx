import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { InventoryFilters } from "@/components/teryaq/items/InventoryFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getInventory, ApiError, type ItemInfo } from "@/lib/api";
import { ExpiryItemRow } from "@/components/teryaq/items/ExpiryItemRow";

const PAGE_SIZE = 100;

export const Route = createFileRoute("/items/expiry")({
  head: () => ({
    meta: [{ title: "انتهاء الصلاحية — Teryaq" }],
  }),
  component: ExpiryPage,
});

function exportExpiry(rows: ItemInfo[]) {
  if (!rows.length) {
    window.alert("لا توجد بيانات للتصدير.");
    return;
  }
  const headers = ["اسم الصنف", "الكود", "الباركود", "الكمية", "التشغيلة", "تاريخ الصلاحية", "الأيام المتبقية", "سعر الشراء", "سعر البيع"];
  const lines = rows.map((row) => [
    row.name || "",
    row.code || "",
    row.barcode || "",
    row.formattedQuantity || "",
    row.batch || "",
    row.expiryDate || "",
    String(row.daysRemaining ?? ""),
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
  anchor.download = `expiry-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExpiryPage() {
  const [filter, setFilter] = useState("expired");
  const [page, setPage] = useState(1);
  const [loadedItems, setLoadedItems] = useState<ItemInfo[]>([]);

  const query = useQuery({
    queryKey: ["inventory-expiry", filter, page, PAGE_SIZE],
    queryFn: () => getInventory({ filter: `expiry-${filter}`, page, pageSize: PAGE_SIZE }),
  });

  useEffect(() => {
    setPage(1);
    setLoadedItems([]);
  }, [filter]);

  useEffect(() => {
    if (!query.data?.rows) return;
    setLoadedItems((current) => {
      if (page === 1) return query.data.rows;
      const existingIds = new Set(current.map((item) => `${item.id}-${item.batch || ""}-${item.expiryDate || ""}`));
      const nextRows = query.data.rows.filter((item) => !existingIds.has(`${item.id}-${item.batch || ""}-${item.expiryDate || ""}`));
      return nextRows.length ? [...current, ...nextRows] : current;
    });
  }, [query.data, page]);

  const items = loadedItems;
  const totalCount = query.data?.totalCount ?? items.length;
  const hasMore = Boolean(query.data?.hasMore);
  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader
          title="انتهاء الصلاحية"
          showBack
          actions={
            <div className="flex gap-1">
              <ActionButton label="تصدير" icon={FileDown} variant="outline" disabled={!items.length} onClick={() => exportExpiry(items)} />
              <ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />
            </div>
          }
        />
        <InventoryFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "expired", label: "منتهي" },
            { id: "0-30", label: "خلال 30 يوم" },
            { id: "31-60", label: "31–60 يوم" },
            { id: "61-90", label: "61–90 يوم" },
          ]}
        />
      </div>

      <div className="mt-2 min-h-[50vh]">
        {query.isLoading ? (
          <LoadingState rows={6} />
        ) : query.isError ? (
          <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
        ) : !items.length ? (
          <EmptyState
            title="لا توجد أصناف مطابقة"
            description="لم يتم العثور على أصناف تنتهي صلاحيتها في الفترة المحددة."
          />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="px-1 text-[12px] text-muted-foreground">
              يعرض {items.length} من {totalCount} صنف
            </p>
            {items.map((item) => (
              <ExpiryItemRow
                key={item.id}
                name={item.name}
                code={item.code == null ? null : String(item.code)}
                barcode={item.barcode}
                formattedQuantity={item.formattedQuantity}
                purchasePrice={item.purchasePrice}
                salePrice={item.salePrice}
                expiryStatus={item.expiryStatus}
                expiryDate={item.expiryDate}
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
