import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getItemTracking, getInventory, ApiError, type ItemInfo, type ItemMovement } from "@/lib/api";
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

  const tracking = trackingQuery.data;

  function movementToRow(row: ItemMovement, options: { showPrice?: boolean } = {}) {
    const showPrice = options.showPrice !== false;
    return {
      date: formatDate(row.date),
      title: row.type || "-",
      subtitle: [
        row.sideName,
        row.invoiceNo ? `فاتورة: ${row.invoiceNo}` : "",
        row.movementNo ? `حركة: ${row.movementNo}` : "",
        showPrice && row.price != null ? `السعر: ${formatNumber(row.price)}` : "",
      ].filter(Boolean).join(" · "),
      quantity: row.formattedQuantity || "",
      amount: row.total,
    };
  }

  function supplierToRow(row: { name: string; quantity?: string | null; lastPurchaseDate: string | null; total?: number | null }) {
    return {
      name: row.name,
      quantity: row.quantity || null,
      lastDate: formatDate(row.lastPurchaseDate),
      total: row.total ?? null,
    };
  }

  function customerToRow(row: { name: string; quantity?: string | null; lastSaleDate: string | null; total?: number | null }) {
    return {
      name: row.name,
      quantity: row.quantity || null,
      lastDate: formatDate(row.lastSaleDate),
      total: row.total ?? null,
    };
  }

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
                <ItemSummaryCards tracking={tracking || undefined} />
              )}
              {activeTab === "purchases" && <PurchaseMovementList rows={(tracking?.purchases || []).map((m) => movementToRow(m))} />}
              {activeTab === "sales" && <SalesMovementList rows={(tracking?.sales || []).map((m) => movementToRow(m))} />}
              {activeTab === "suppliers" && <ItemSupplierList rows={(tracking?.suppliers || []).map(supplierToRow)} />}
              {activeTab === "customers" && <ItemCustomerList rows={(tracking?.customers || []).map(customerToRow)} />}
              {activeTab === "movements" && <ItemMovementList rows={(tracking?.movements || []).map((m) => movementToRow(m))} />}
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
          placeholder="ابحث عن صنف بالاسم أو الكود أو الباركود..."
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

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function ItemSummaryCards({ tracking }: { tracking?: Awaited<ReturnType<typeof getItemTracking>> }) {
  const summary = tracking?.summary;
  const cards = [
    { label: "المخزون الحالي", value: summary?.formattedStock || "-" },
    { label: "إجمالي الداخل", value: formatNumber(summary?.totalIn) },
    { label: "إجمالي الخارج", value: formatNumber(summary?.totalOut) },
    { label: "مردودات البيع", value: formatNumber(summary?.salesReturns) },
    { label: "مردودات الشراء", value: formatNumber(summary?.purchaseReturns) },
    { label: "آخر سعر شراء", value: formatNumber(summary?.lastPurchasePrice) },
    { label: "آخر سعر بيع", value: formatNumber(summary?.lastSalePrice) },
    { label: "الربح التقريبي", value: summary?.approximateProfit == null ? "غير متوفر" : formatNumber(summary.approximateProfit) },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => (
        <div key={card.label} className="card-surface p-3">
          <p className="text-[11px] font-bold text-muted-foreground">{card.label}</p>
          <p className="num mt-1 text-[15px] font-extrabold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
