import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, subDays } from "date-fns";
import { ArrowRight, CalendarDays, RefreshCw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { KPICard } from "@/components/teryaq/KPICard";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { ApiError, getAnalyticsProfitSummary, type AnalyticsProfitSummaryDay } from "@/lib/api";

export const Route = createFileRoute("/profit-reports/trading/flow")({
  head: () => ({
    meta: [{ title: "أرباح حسب Teryaq Flow - Teryaq" }],
  }),
  component: FlowProfitPage,
});

const RANGE_OPTIONS = [
  { id: "today", label: "اليوم" },
  { id: "yesterday", label: "أمس" },
  { id: "week", label: "هذا الأسبوع" },
  { id: "month", label: "هذا الشهر" },
  { id: "custom", label: "فترة" },
];

function localDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function presetRange(range: string) {
  const today = new Date();
  if (range === "yesterday") {
    const yesterday = subDays(today, 1);
    return { dateFrom: localDate(yesterday), dateTo: localDate(yesterday) };
  }
  if (range === "week") return { dateFrom: localDate(subDays(today, 6)), dateTo: localDate(today) };
  if (range === "month") return { dateFrom: localDate(startOfMonth(today)), dateTo: localDate(today) };
  return { dateFrom: localDate(today), dateTo: localDate(today) };
}

function formatMoney(value?: number | null) {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))} د.ل`;
}

function formatPercent(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("ar-LY", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value || 0))}%`;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function sum(values: Array<number | null | undefined>) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function reconciliationStatus(day: AnalyticsProfitSummaryDay) {
  const periodRevenue = sum((day.periods || []).map((period) => period.revenue));
  const periodProfit = sum((day.periods || []).map((period) => period.profit));
  return {
    revenueDifference: periodRevenue - Number(day.revenue || 0),
    profitDifference: periodProfit - Number(day.profit || 0),
  };
}

function FlowProfitDayCard({ day }: { day: AnalyticsProfitSummaryDay }) {
  const reconciliation = reconciliationStatus(day);
  const hasMismatch = Math.abs(reconciliation.revenueDifference) > 0.01 || Math.abs(reconciliation.profitDifference) > 0.01;

  return (
    <Link
      to="/profit-reports/trading/flow/$date"
      params={{ date: day.date }}
      className="card-surface block touch-manipulation p-3 active:scale-[0.99]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-foreground">{formatDateLabel(day.date)}</h2>
          <p className="text-[11px] text-muted-foreground">
            {Number(day.movementCount || 0).toLocaleString("ar-LY")} حركة بيع · {Number(day.detailCount || 0).toLocaleString("ar-LY")} سطر صنف
          </p>
        </div>
        <ArrowRight className="mt-1 size-4 shrink-0 rotate-180 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[12px]">
        <div className="rounded-lg bg-secondary/50 p-2">
          <p className="text-muted-foreground">الإيراد</p>
          <p className="num mt-1 font-extrabold">{formatMoney(day.revenue)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100">
          <p className="text-emerald-700 dark:text-emerald-300">ربح Teryaq Flow</p>
          <p className="num mt-1 font-extrabold">{formatMoney(day.profit)}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-2">
          <p className="text-muted-foreground">هامش الربح</p>
          <p className="num mt-1 font-extrabold">{formatPercent(day.margin)}</p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-2">
          <p className="text-muted-foreground">التكلفة</p>
          <p className="num mt-1 font-extrabold">{formatMoney(day.cost)}</p>
        </div>
      </div>

      {hasMismatch ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
          يوجد فرق تجميعي يحتاج مراجعة: الإيراد {formatMoney(reconciliation.revenueDifference)}، الربح {formatMoney(reconciliation.profitDifference)}
        </p>
      ) : null}
    </Link>
  );
}

function FlowProfitPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/profit-reports/trading/flow") {
    return <Outlet />;
  }

  return <FlowProfitList />;
}

function FlowProfitList() {
  const today = useMemo(() => localDate(new Date()), []);
  const [range, setRange] = useState("month");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);

  const queryDates = useMemo(() => {
    if (range === "custom") return { dateFrom: customFrom, dateTo: customTo };
    return presetRange(range);
  }, [customFrom, customTo, range]);

  const query = useQuery({
    queryKey: ["analytics", "profit-summary", queryDates.dateFrom, queryDates.dateTo],
    queryFn: () => getAnalyticsProfitSummary(queryDates),
  });

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const summary = query.data?.summary;
  const days = query.data?.days || [];

  return (
    <AppShell>
      <PageHeader
        title="أرباح حسب Teryaq Flow"
        subtitle="ربح تحليلي من حركات البيع وتكلفة وحدة البيع، وليس بديلا عن الربح الرسمي في المحاسب."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />}
      />

      <div className="mb-4 space-y-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
            <CalendarDays className="size-4" />
          </span>
          <div className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-max">
              <SegmentedTabs options={RANGE_OPTIONS} value={range} onChange={setRange} />
            </div>
          </div>
        </div>

        {range === "custom" ? (
          <CompactDateRange
            dateFrom={customFrom}
            dateTo={customTo}
            onChangeFrom={setCustomFrom}
            onChangeTo={setCustomTo}
            onRefresh={() => query.refetch()}
          />
        ) : null}
      </div>

      {query.isLoading ? (
        <LoadingState rows={6} />
      ) : query.isError ? (
        <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <EmptyState title="لا توجد بيانات" description="تعذر تحميل تقرير أرباح Teryaq Flow للفترة المختارة." />
      ) : (
        <div className="space-y-4 pb-8">
          <KPIGrid>
            <KPICard label="الإيراد" value={formatMoney(summary?.totalRevenue)} icon={TrendingUp} tone="info" />
            <KPICard label="ربح Teryaq Flow" value={formatMoney(summary?.totalProfit)} icon={TrendingUp} tone="success" />
            <KPICard label="التكلفة التحليلية" value={formatMoney(summary?.totalCost)} icon={TrendingUp} tone="default" />
            <KPICard label="هامش الربح" value={formatPercent(summary?.margin)} icon={TrendingUp} tone="default" />
          </KPIGrid>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black">الأيام</h2>
              <p className="text-[11px] text-muted-foreground">كل يوم محسوب من بياناته الفعلية، والفترات داخله محسوبة من نفس الحركات.</p>
            </div>
            <StatusBadge label={`${days.length.toLocaleString("ar-LY")} يوم`} tone="info" />
          </div>

          {days.length ? (
            <div className="space-y-2">
              {days.map((day) => (
                <FlowProfitDayCard key={day.date} day={day} />
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد أرباح تحليلية" description="لا توجد حركات بيع للفترة المختارة." />
          )}
        </div>
      )}
    </AppShell>
  );
}
