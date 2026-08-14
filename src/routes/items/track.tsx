import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getItemTracking, getInventory, ApiError, type ItemInfo } from "@/lib/api";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { ItemSearchResults } from "@/components/teryaq/items/ItemSearchResults";
import { SelectedItemHeader } from "@/components/teryaq/items/SelectedItemHeader";
import { PurchaseMovementList } from "@/components/teryaq/items/PurchaseMovementList";
import { SalesMovementList } from "@/components/teryaq/items/SalesMovementList";
import { ItemMovementList } from "@/components/teryaq/items/ItemMovementList";
import { ItemSupplierList } from "@/components/teryaq/items/ItemSupplierList";
import { ItemCustomerList } from "@/components/teryaq/items/ItemCustomerList";

export const Route = createFileRoute("/items/track")({
  head: () => ({
    meta: [{ title: "تتبع صنف — Teryaq" }],
  }),
  component: ItemTrackingPage,
});

const TABS = [
  { id: "summary", label: "ملخص" },
  { id: "purchases", label: "مشتريات" },
  { id: "sales", label: "مبيعات" },
  { id: "suppliers", label: "موردون" },
  { id: "customers", label: "عملاء" },
  { id: "movements", label: "كل الحركات" },
];

function ItemTrackingPage() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<ItemInfo | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const searchResults = useQuery({
    queryKey: ["inventory-search", search],
    queryFn: () => getInventory({ search }),
    enabled: search.length > 2 && !selectedItem,
  });

  const trackingQuery = useQuery({
    queryKey: ["item-tracking", selectedItem?.id],
    queryFn: () => getItemTracking(selectedItem!.id),
    enabled: !!selectedItem,
  });

  if (selectedItem) {
    return (
      <AppShell>
        <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
          <PageHeader
            title="تتبع صنف"
            showBack
            actions={
              <ActionButton label="تغيير الصنف" variant="outline" onClick={() => setSelectedItem(null)} />
            }
          />
          <SelectedItemHeader item={selectedItem} />
          <div className="-mx-4 overflow-x-auto px-4">
            <div className="min-w-[420px]">
              <SegmentedTabs value={activeTab} onChange={setActiveTab} options={TABS} />
            </div>
          </div>
        </div>

        <div className="mt-2 min-h-[40vh]">
          {trackingQuery.isLoading ? (
            <LoadingState rows={4} />
          ) : trackingQuery.isError ? (
            <ErrorState
              description={trackingQuery.error instanceof ApiError ? trackingQuery.error.message : "تعذر تحميل بيانات التتبع"}
              onRetry={() => trackingQuery.refetch()}
            />
          ) : (
            <div className="space-y-3">
              {activeTab === "summary" && (
                <EmptyState title="ملخص حركة الصنف" description="سيتم عرض إحصائيات الدخول والخروج والربحية هنا." />
              )}
              {activeTab === "purchases" && <PurchaseMovementList />}
              {activeTab === "sales" && <SalesMovementList />}
              {activeTab === "suppliers" && <ItemSupplierList />}
              {activeTab === "customers" && <ItemCustomerList />}
              {activeTab === "movements" && <ItemMovementList />}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="تتبع صنف" showBack subtitle="اختر صنفًا لعرض تفاصيل حركته" />
      <div className="mb-4">
        <SearchInput
          placeholder="ابحث عن صنف بالاسم أو الكود..."
          value={search}
          onChange={(val) => setSearch(val)}
        />
      </div>

      <div className="min-h-[40vh]">
        {!search ? (
          <EmptyState icon={Search} title="ابدأ البحث" description="أدخل 3 أحرف على الأقل للبحث عن الأصناف." />
        ) : searchResults.isLoading ? (
          <LoadingState />
        ) : !searchResults.data?.rows.length ? (
          <EmptyState title="لا توجد نتائج" description="لم يتم العثور على صنف يطابق بحثك." />
        ) : (
          <ItemSearchResults items={searchResults.data.rows} onSelect={(item) => setSelectedItem(item)} />
        )}
      </div>
    </AppShell>
  );
}
