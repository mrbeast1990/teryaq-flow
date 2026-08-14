import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { InventoryFilters } from "@/components/teryaq/items/InventoryFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getInventory, ApiError } from "@/lib/api";
import { InventoryItemRow } from "@/components/teryaq/items/InventoryItemRow";

export const Route = createFileRoute("/items/stock")({
  head: () => ({
    meta: [{ title: "المخزون — Teryaq" }],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const query = useQuery({
    queryKey: ["inventory", search, filter],
    queryFn: () => getInventory({ search, filter }),
  });

  const items = query.data?.rows || [];
  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader
          title="المخزون"
          showBack
          actions={
            <div className="flex gap-1">
              <ActionButton label="تصدير" icon={FileDown} variant="outline" disabled={!items.length} />
              <ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />
            </div>
          }
        />
        <div className="mt-2 space-y-2">
          <SearchInput
            placeholder="اسم الصنف، الكود، أو الباركود..."
            value={search}
            onChange={(val) => setSearch(val)}
          />
          <InventoryFilters
            value={filter}
            onChange={setFilter}
            options={[
              { id: "all", label: "الكل" },
              { id: "available", label: "المتوفر فقط" },
              { id: "near-expiry", label: "قريب الانتهاء" },
            ]}
          />
        </div>
      </div>

      <div className="mt-2 min-h-[50vh]">
        {query.isLoading ? (
          <LoadingState rows={6} />
        ) : query.isError ? (
          <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
        ) : !items.length ? (
          <EmptyState
            title="لا توجد أصناف"
            description={search ? "لم يتم العثور على نتائج للبحث الحالي." : "قائمة المخزون فارغة حاليًا."}
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
