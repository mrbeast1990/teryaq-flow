import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PackageSearch, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { useMemo, useState } from "react";
import { ApiError, getAnalyticsDailyProfit, type AnalyticsProfitItemRow } from "@/lib/api";

export const Route = createFileRoute("/trading/items")({
  component: ItemProfitPage,
});

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))} د.ل`;
}

function formatQuantity(value?: number | null) {
  if (value == null) return "غير متوفر";
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function selectRows(data: Awaited<ReturnType<typeof getAnalyticsDailyProfit>> | undefined, filter: string) {
  if (!data) return [];
  if (filter === "least-profitable") return data.worstProfitItems || [];
  if (filter === "best-selling") return data.mostSoldItems || [];
  return data.bestProfitItems || [];
}

function itemMatches(row: AnalyticsProfitItemRow, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return String(row.itemName || "").toLowerCase().includes(needle)
    || String(row.itemId || "").toLowerCase().includes(needle);
}

export function ItemProfitPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("most-profitable");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trading", "items", dateFrom, dateTo],
    queryFn: () => getAnalyticsDailyProfit({ dateFrom, dateTo }),
  });

  const apiError = error as ApiError | null;
  const rows = useMemo(
    () => selectRows(data, activeFilter).filter((row) => itemMatches(row, search)),
    [activeFilter, data, search],
  );

  return (
    <AppShell>
      <PageHeader
        title="تحليل ربحية الأصناف"
        subtitle="قوائم تحليلية من بيانات الحركات، منفصلة عن الربح الرسمي"
        showBack
      />

      <div className="mb-4 space-y-3">
        <CompactDateRange
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={setDateFrom}
          onChangeTo={setDateTo}
          onRefresh={() => refetch()}
        />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="بحث عن صنف أو كود..."
        />

        <FilterBar>
          <FilterChip
            label="الأعلى ربحًا"
            active={activeFilter === "most-profitable"}
            onClick={() => setActiveFilter("most-profitable")}
          />
          <FilterChip
            label="الأقل ربحًا"
            active={activeFilter === "least-profitable"}
            onClick={() => setActiveFilter("least-profitable")}
          />
          <FilterChip
            label="الأعلى مبيعًا"
            active={activeFilter === "best-selling"}
            onClick={() => setActiveFilter("best-selling")}
          />
        </FilterBar>

        <div className="card-surface p-3 text-[12px] font-semibold text-muted-foreground">
          تحليل تقديري مبني على تكلفة الصنف المسجلة بالحركات، ولا يمثل إجمالي الربح المحاسبي الرسمي.
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState description={apiError?.message || "تعذر تحميل ربحية الأصناف"} onRetry={() => refetch()} />
      ) : rows.length ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] font-bold text-muted-foreground">بيانات حقيقية من /api/analytics/daily-profit</p>
            <StatusBadge label={`${rows.length.toLocaleString("ar-LY")} صنف`} tone="info" />
          </div>
          {rows.map((row) => (
            <CompactListCard
              key={`${row.itemId}-${activeFilter}`}
              title={row.itemName || "صنف غير محدد"}
              subtitle={`الكود: ${row.itemId} · الكمية: ${formatQuantity(row.quantity)} · المبيعات: ${formatMoney(row.salesValue)}`}
              value={activeFilter === "best-selling" ? formatQuantity(row.quantity) : formatMoney(row.approximateProfit)}
              meta={activeFilter === "best-selling" ? formatMoney(row.salesValue) : "ربح تحليلي تقديري"}
              icon={activeFilter === "least-profitable" ? TrendingDown : TrendingUp}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="لم يتم العثور على نتائج"
          description="لا توجد بيانات حقيقية مطابقة للفترة أو البحث الحالي."
          icon={PackageSearch}
        />
      )}
    </AppShell>
  );
}
