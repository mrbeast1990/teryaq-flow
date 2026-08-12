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
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { ActionButton } from "@/components/teryaq/ActionButton";

export const Route = createFileRoute("/items/track")({
  head: () => ({
    meta: [{ title: "تتبع صنف — Teryaq" }],
  }),
  component: ItemTrackingPage,
});

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
              <ActionButton
                label="تغيير الصنف"
                variant="outline"
                onClick={() => setSelectedItem(null)}
              />
            }
          />
          <div className="card-surface mb-3 p-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-primary">{selectedItem.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {selectedItem.code ? `كود: ${selectedItem.code}` : ""}
                  {selectedItem.barcode ? ` · باركود: ${selectedItem.barcode}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-left">
                <p className="num text-[15px] font-extrabold">{selectedItem.formattedQuantity || "0"}</p>
                <p className="text-[11px] text-muted-foreground">الرصيد الحالي</p>
              </div>
            </div>
          </div>
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { id: "summary", label: "ملخص" },
              { id: "purchases", label: "مشتريات" },
              { id: "sales", label: "مبيعات" },
              { id: "movements", label: "حركات" },
            ]}
          />
        </div>

        <div className="mt-2 min-h-[40vh]">
          {trackingQuery.isLoading ? (
            <LoadingState rows={4} />
          ) : trackingQuery.isError ? (
            <ErrorState description={trackingQuery.error instanceof ApiError ? trackingQuery.error.message : "تعذر تحميل بيانات التتبع"} />
          ) : (
            <div className="space-y-3">
              {activeTab === "summary" && <EmptyState title="ملخص حركة الصنف" description="سيتم عرض إحصائيات الدخول والخروج والربحية هنا." />}
              {activeTab === "purchases" && <EmptyState title="لا توجد عمليات شراء" description="لم يتم العثور على فواتير شراء لهذا الصنف." />}
              {activeTab === "sales" && <EmptyState title="لا توجد عمليات بيع" description="لم يتم العثور على فواتير بيع لهذا الصنف." />}
              {activeTab === "movements" && <EmptyState title="لا توجد حركات" description="لا يوجد سجل حركات لهذا الصنف." />}
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
          <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border/50">
            {searchResults.data.rows.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
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
        )}
      </div>
    </AppShell>
  );
}
