import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { InventoryFilters } from "@/components/teryaq/items/InventoryFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getInventory, ApiError } from "@/lib/api";
import { ExpiryItemRow } from "@/components/teryaq/items/ExpiryItemRow";

export const Route = createFileRoute("/items/expiry")({
  head: () => ({
    meta: [{ title: "انتهاء الصلاحية — Teryaq" }],
  }),
  component: ExpiryPage,
});

function ExpiryPage() {
  const [filter, setFilter] = useState("30");

  const query = useQuery({
    queryKey: ["inventory-expiry", filter],
    queryFn: () => getInventory({ filter: `expiry-${filter}` }),
  });

  const items = query.data?.rows || [];
  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader
          title="انتهاء الصلاحية"
          showBack
          actions={
            <div className="flex gap-1">
              <ActionButton label="تصدير" icon={FileDown} variant="outline" disabled={!items.length} />
              <ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />
            </div>
          }
        />
        <InventoryFilters
          value={filter}
          onChange={setFilter}
          options={[
            { id: "expired", label: "منتهي" },
            { id: "30", label: "خلال 30 يوم" },
            { id: "60", label: "خلال 60 يوم" },
            { id: "90", label: "خلال 90 يوم" },
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
            {items.map((item) => (
              <ExpiryItemRow
                key={item.id}
                name={item.name}
                code={item.code}
                barcode={item.barcode}
                formattedQuantity={item.formattedQuantity}
                purchasePrice={item.purchasePrice}
                salePrice={item.salePrice}
                expiryStatus={item.expiryStatus}
                expiryDate={item.expiryDate}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
