import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Info, RefreshCw, TrendingDown, TrendingUp, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { getAnalyticsDailyProfit, ApiError, type AnalyticsProfitItemRow } from "@/lib/api";

export const Route = createFileRoute("/analytics/item-profit")({
  head: () => ({
    meta: [{ title: "تحليل ربحية الأصناف — Teryaq" }],
  }),
  component: ItemProfitabilityPage,
});

const TABS = [
  { id: "top-profit", label: "الأعلى ربحًا" },
  { id: "low-profit", label: "الأقل ربحًا" },
  { id: "top-sales", label: "الأعلى مبيعًا" },
];

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value || 0))} د.ل`;
}

function formatNumber(value?: number | null) {
  if (value == null) return "غير متوفر";
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function activeRows(data: Awaited<ReturnType<typeof getAnalyticsDailyProfit>> | undefined, tab: string) {
  if (tab === "low-profit") return data?.worstProfitItems || [];
  if (tab === "top-sales") return data?.mostSoldItems || [];
  return data?.bestProfitItems || [];
}

function ItemProfitRow({ row, rank }: { row: AnalyticsProfitItemRow; rank: number }) {
  return (
    <Link to="/items/track" className="block touch-manipulation active:scale-[0.99]">
      <CompactListCard
        title={`${rank}. ${row.itemName || "صنف غير مسمى"}`}
        subtitle={`الكمية: ${formatNumber(row.quantity)} · المبيعات: ${formatMoney(row.salesValue)}`}
        value={formatMoney(row.approximateProfit)}
        meta="ربح تحليلي تقديري"
        icon={TrendingUp}
      />
    </Link>
  );
}

function ItemProfitabilityPage() {
  const [activeTab, setActiveTab] = useState("top-profit");
  const [range, setRange] = useState({ from: today(), to: today() });
  const queryParams = useMemo(() => ({ dateFrom: range.from, dateTo: range.to }), [range]);

  const profitQuery = useQuery({
    queryKey: ["analytics", "item-profitability", queryParams],
    queryFn: () => getAnalyticsDailyProfit(queryParams),
    enabled: Boolean(range.from && range.to),
  });

  const rows = activeRows(profitQuery.data, activeTab);
  const errorMessage = profitQuery.error instanceof ApiError || profitQuery.error instanceof Error ? profitQuery.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="تحليل ربحية الأصناف"
        subtitle="ترتيب تحليلي للأصناف حسب بيانات الحركات الفعلية."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => profitQuery.refetch()} />}
      />

      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        <div className="flex gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>تحليل تقديري مبني على تكلفة الصنف المسجلة بالحركات، ولا يمثل إجمالي الربح المحاسبي الرسمي.</p>
        </div>
      </div>

      <div className="mb-4">
        <CompactDateRange
          dateFrom={range.from}
          dateTo={range.to}
          onChangeFrom={(value: string) => setRange((current) => ({ ...current, from: value }))}
          onChangeTo={(value: string) => setRange((current) => ({ ...current, to: value }))}
          onRefresh={() => profitQuery.refetch()}
        />
      </div>

      <SegmentedTabs options={TABS} value={activeTab} onChange={setActiveTab} />

      <div className="mt-4 pb-8">
        {profitQuery.isLoading ? (
          <LoadingState rows={6} />
        ) : profitQuery.isError ? (
          <ErrorState description={errorMessage} onRetry={() => profitQuery.refetch()} />
        ) : !rows.length ? (
          <EmptyState
            title="لا توجد بيانات تحليلية"
            description="لا توجد حركات أصناف للفترة المختارة."
            icon={activeTab === "low-profit" ? TrendingDown : activeTab === "top-sales" ? ShoppingCart : TrendingUp}
          />
        ) : (
          <div className="space-y-2">
            {rows.map((row, index) => (
              <ItemProfitRow key={`${activeTab}-${row.itemId}-${index}`} row={row} rank={index + 1} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
