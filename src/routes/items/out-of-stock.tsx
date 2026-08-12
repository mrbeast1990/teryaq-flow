import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getInventory, ApiError } from "@/lib/api";
import { InventoryItemRow } from "@/components/teryaq/items/InventoryItemRow";

export const Route = createFileRoute("/items/out-of-stock")({
  head: () => ({
    meta: [{ title: "أصناف نفدت — Teryaq" }],
  }),
  component: OutOfStockPage,
});

function OutOfStockPage() {
  const query = useQuery({
    queryKey: ["inventory-out-of-stock"],
    queryFn: () => getInventory({ filter: "out-of-stock" }),
  });

  const items = query.data?.rows || [];
  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="أصناف نفدت"
        showBack
        actions={
          <div className="flex gap-1">
            <ActionButton label="تصدير" icon={FileDown} variant="outline" disabled={!items.length} />
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
            {items.map((item) => (
              <InventoryItemRow
                key={item.id}
                name={item.name}
                code={item.code}
                barcode={item.barcode}
                formattedQuantity={item.formattedQuantity}
                purchasePrice={item.purchasePrice}
                salePrice={item.salePrice}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
