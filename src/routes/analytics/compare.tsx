import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { ArrowDown, ArrowLeftRight, ArrowUp, CalendarDays, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { getAnalyticsComparePeriods, ApiError, type AnalyticsComparePeriodsResponse } from "@/lib/api";

export const Route = createFileRoute("/analytics/compare")({
  head: () => ({
    meta: [{ title: "مقارنة الفترات — Teryaq" }],
  }),
  component: ComparePeriodsPage,
});

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

function yesterday() {
  return format(subDays(new Date(), 1), "yyyy-MM-dd");
}

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(value || 0))} د.ل`;
}

function formatPercent(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

function metricChange(left?: number | null, right?: number | null) {
  if (left == null || right == null) return { diff: null, percent: null };
  const diff = Number(right) - Number(left);
  return {
    diff,
    percent: Number(left) === 0 ? null : (diff / Math.abs(Number(left))) * 100,
  };
}

function ComparisonRow({
  label,
  left,
  right,
  hint,
}: {
  label: string;
  left?: number | null;
  right?: number | null;
  hint: string;
}) {
  const change = metricChange(left, right);
  const positive = Number(change.diff || 0) >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;

  return (
    <div className="card-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-black">{label}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"}`}>
          <Icon className="size-3" />
          {formatPercent(change.percent)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-muted-foreground">الفترة 1</p>
          <p className="num text-[13px] font-extrabold">{formatMoney(left)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">الفترة 2</p>
          <p className="num text-[13px] font-extrabold">{formatMoney(right)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">الفرق</p>
          <p className="num text-[13px] font-extrabold">{formatMoney(change.diff)}</p>
        </div>
      </div>
    </div>
  );
}

function CompareResults({ data }: { data: AnalyticsComparePeriodsResponse }) {
  const metrics = [
    {
      label: "الإيراد",
      left: data.left.revenue?.netRevenue,
      right: data.right.revenue?.netRevenue,
      hint: "Revenue مستقل عن مبيعات المتاجرة",
    },
    {
      label: "المبيعات",
      left: data.left.profit?.revenue,
      right: data.right.profit?.revenue,
      hint: "The_Profit.Trading_Income",
    },
    {
      label: "الربح الرسمي",
      left: data.left.profit?.grossProfit ?? data.left.profit?.netProfit,
      right: data.right.profit?.grossProfit ?? data.right.profit?.netProfit,
      hint: "The_Profit.Trading_Profit",
    },
  ];

  return (
    <div className="space-y-2">
      {metrics.map((metric) => (
        <ComparisonRow key={metric.label} {...metric} />
      ))}
    </div>
  );
}

function ComparePeriodsPage() {
  const [period1, setPeriod1] = useState({ from: yesterday(), to: yesterday() });
  const [period2, setPeriod2] = useState({ from: today(), to: today() });
  const queryParams = useMemo(() => ({
    leftFrom: period1.from,
    leftTo: period1.to,
    rightFrom: period2.from,
    rightTo: period2.to,
  }), [period1, period2]);

  const compareQuery = useQuery({
    queryKey: ["analytics", "compare", queryParams],
    queryFn: () => getAnalyticsComparePeriods(queryParams),
    enabled: Boolean(period1.from && period1.to && period2.from && period2.to),
  });

  const errorMessage = compareQuery.error instanceof ApiError || compareQuery.error instanceof Error ? compareQuery.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="مقارنة الفترات"
        subtitle="مقارنة الإيراد ومبيعات المتاجرة والربح الرسمي بين فترتين."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => compareQuery.refetch()} />}
      />

      <div className="space-y-6 pb-8">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <SectionHeader title="الفترة الأولى" />
            <CompactDateRange
              dateFrom={period1.from}
              dateTo={period1.to}
              onChangeFrom={(v: string) => setPeriod1((prev) => ({ ...prev, from: v }))}
              onChangeTo={(v: string) => setPeriod1((prev) => ({ ...prev, to: v }))}
              onRefresh={() => compareQuery.refetch()}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <SectionHeader title="الفترة الثانية" />
            <CompactDateRange
              dateFrom={period2.from}
              dateTo={period2.to}
              onChangeFrom={(v: string) => setPeriod2((prev) => ({ ...prev, from: v }))}
              onChangeTo={(v: string) => setPeriod2((prev) => ({ ...prev, to: v }))}
              onRefresh={() => compareQuery.refetch()}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>

        {compareQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : compareQuery.isError ? (
          <ErrorState description={errorMessage} onRetry={() => compareQuery.refetch()} />
        ) : compareQuery.data ? (
          <CompareResults data={compareQuery.data} />
        ) : (
          <EmptyState
            title="بانتظار تحديد الفترات"
            description="اختر الفترتين لعرض مقارنة مالية من البيانات الحقيقية."
            icon={CalendarDays}
          />
        )}
      </div>
    </AppShell>
  );
}
