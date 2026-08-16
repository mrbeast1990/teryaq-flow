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
type TrustFilter = "trusted" | "review";

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value || 0))} د.ل`;
}

function formatPercent(value?: number | null) {
  if (value == null) return "";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(Number(value || 0))}%`;
}

function formatCount(value?: number | null) {
  return new Intl.NumberFormat("ar-LY").format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "بدون تاريخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function statusLabel(status?: string | null) {
  if (status === "unit_mismatch_risk") return "اختلاف وحدة";
  if (status === "opening_balance_risk") return "رصيد افتتاحي";
  if (status === "data_anomaly") return "بيانات تحتاج مراجعة";
  return "موثوق";
}

function statusTone(status?: string | null) {
  if (status === "valid") return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
  return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
}

function PriceRow({ row }: { row: AnalyticsPriceChangeRow }) {
  const diff = Number(row.difference || 0);
  const increase = diff >= 0;
  const Icon = increase ? ArrowUp : ArrowDown;
  const supplierChanged = String(row.previousSupplierId ?? row.previousSupplierName ?? "") !== String(row.latestSupplierId ?? row.latestSupplierName ?? "");

  return (
    <div className="card-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-black">{row.itemName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.barcode || "بدون باركود"} · {row.unitName || "وحدة غير محددة"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${increase ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"}`}>
            <Icon className="size-3" />
            {formatPercent(row.percentChange)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone(row.status)}`}>
            {statusLabel(row.status)}
          </span>
        </div>
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

      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
        <p>السابق: {row.previousSupplierName || "مورد غير محدد"} · {formatDate(row.previousPriceDate)}</p>
        <p>الأخير: {row.latestSupplierName || "مورد غير محدد"} · {formatDate(row.latestPriceDate)}</p>
        {supplierChanged ? <p className="font-semibold text-foreground/80">المقارنة بين موردين مختلفين.</p> : null}
        {row.status !== "valid" ? <p>{row.statusReason || "تحتاج هذه المقارنة إلى مراجعة قبل الاعتماد عليها."}</p> : null}
      </div>
    </div>
  );
}

function PriceMonitoringPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PriceFilter>("all");
  const [trustFilter, setTrustFilter] = useState<TrustFilter>("trusted");

  const priceQuery = useQuery({
    queryKey: ["analytics", "price-changes", trustFilter],
    queryFn: () => getAnalyticsPriceChanges({
      page: 1,
      pageSize: 100,
      sort: "latest",
      status: trustFilter === "trusted" ? "valid" : "review",
    }),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (priceQuery.data?.rows || []).filter((row) => {
      const diff = Number(row.difference || 0);
      if (filter === "increase" && diff <= 0) return false;
      if (filter === "decrease" && diff >= 0) return false;
      if (!term) return true;
      return [row.itemName, row.barcode, row.previousSupplierName, row.latestSupplierName, row.supplierName].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [filter, priceQuery.data?.rows, search]);

  const errorMessage = priceQuery.error instanceof ApiError || priceQuery.error instanceof Error ? priceQuery.error.message : undefined;
  const summary = priceQuery.data?.summary;

  return (
    <AppShell>
      <PageHeader
        title="مراقبة أسعار الشراء"
        subtitle="تغير آخر سعر شراء تجاري للصنف مقارنة بسعر الشراء التجاري السابق، مع توضيح المورد والوحدة."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => priceQuery.refetch()} />}
      />

      <div className="space-y-3">
        <SearchInput
          placeholder="ابحث عن صنف أو مورد..."
          value={search}
          onChange={setSearch}
        />
        <FilterBar>
          <FilterChip label="موثوق" active={trustFilter === "trusted"} onClick={() => setTrustFilter("trusted")} />
          <FilterChip label="يحتاج مراجعة" active={trustFilter === "review"} onClick={() => setTrustFilter("review")} />
          <FilterChip label="الكل" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip label="ارتفاع السعر" active={filter === "increase"} onClick={() => setFilter("increase")} />
          <FilterChip label="انخفاض السعر" active={filter === "decrease"} onClick={() => setFilter("decrease")} />
        </FilterBar>
      </div>

      <p className="mb-3 text-[11px] text-muted-foreground">
        تعرض القائمة أحدث 100 نتيجة من التصنيف المختار. النتائج الموثوقة فقط تدخل في تنبيهات تغير أسعار الشراء.
        {summary ? (
          <span className="block">
            موثوق: {formatCount(summary.trustedValidChanges)}
            {" · "}يحتاج مراجعة: {formatCount(summary.reviewRows)}
          </span>
        ) : null}
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
              <PriceRow key={`${row.itemId}-${row.latestMovementNo}-${row.previousMovementNo}-${row.status}`} row={row} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
