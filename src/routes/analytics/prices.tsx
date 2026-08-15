import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, History, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { getAnalyticsPriceChanges, ApiError, type AnalyticsPriceChangeRow } from "@/lib/api";

export const Route = createFileRoute("/analytics/prices")({
  head: () => ({
    meta: [{ title: "مراقبة أسعار الشراء — Teryaq" }],
  }),
  component: PriceMonitoringPage,
});

type PriceFilter = "all" | "increase" | "decrease";

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value || 0))} د.ل`;
}

function formatPercent(value?: number | null) {
  if (value == null) return "";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value || 0))}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "بدون تاريخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function PriceRow({ row }: { row: AnalyticsPriceChangeRow }) {
  const diff = Number(row.difference || 0);
  const increase = diff >= 0;
  const Icon = increase ? ArrowUp : ArrowDown;

  return (
    <div className="card-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-black">{row.itemName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.barcode || "بدون باركود"} · {row.supplierName || "مورد غير محدد"}
          </p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${increase ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"}`}>
          <Icon className="size-3" />
          {formatPercent(row.percentChange)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">السابق</p>
          <p className="num text-[12px] font-extrabold">{formatMoney(row.previousPurchasePrice)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">الأخير</p>
          <p className="num text-[12px] font-extrabold">{formatMoney(row.latestPurchasePrice)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">الفرق</p>
          <p className="num text-[12px] font-extrabold">{formatMoney(row.difference)}</p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">آخر شراء: {formatDate(row.latestPriceDate)}</p>
    </div>
  );
}

function PriceMonitoringPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PriceFilter>("all");

  const priceQuery = useQuery({
    queryKey: ["analytics", "price-changes"],
    queryFn: getAnalyticsPriceChanges,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (priceQuery.data?.rows || []).filter((row) => {
      const diff = Number(row.difference || 0);
      if (filter === "increase" && diff <= 0) return false;
      if (filter === "decrease" && diff >= 0) return false;
      if (!term) return true;
      return [row.itemName, row.barcode, row.supplierName].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [filter, priceQuery.data?.rows, search]);

  const errorMessage = priceQuery.error instanceof ApiError || priceQuery.error instanceof Error ? priceQuery.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="مراقبة أسعار الشراء"
        subtitle="تتبع تغير تكلفة الشراء من آخر حركتين شراء لكل صنف."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => priceQuery.refetch()} />}
      />

      <div className="space-y-3">
        <SearchInput
          placeholder="ابحث عن صنف أو مورد..."
          value={search}
          onChange={setSearch}
        />
        <FilterBar>
          <FilterChip label="الكل" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip label="ارتفاع السعر" active={filter === "increase"} onClick={() => setFilter("increase")} />
          <FilterChip label="انخفاض السعر" active={filter === "decrease"} onClick={() => setFilter("decrease")} />
        </FilterBar>
      </div>

      <p className="mb-3 text-[11px] text-muted-foreground">
        يعرض الـBackend حتى 200 تغير في أسعار الشراء، ولا يشمل مراقبة سعر البيع.
      </p>

      <div className="pb-8">
        {priceQuery.isLoading ? (
          <LoadingState rows={6} />
        ) : priceQuery.isError ? (
          <ErrorState description={errorMessage} onRetry={() => priceQuery.refetch()} />
        ) : !rows.length ? (
          <EmptyState
            title="لا توجد بيانات"
            description="لا توجد تغيرات أسعار شراء مطابقة للفلاتر الحالية."
            icon={History}
          />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <PriceRow key={`${row.itemId}-${row.latestPriceDate}-${row.previousPriceDate}`} row={row} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
