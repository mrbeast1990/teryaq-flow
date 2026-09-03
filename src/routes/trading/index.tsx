import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, DollarSign, Percent, RefreshCw, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { format, startOfMonth, subDays } from "date-fns";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { LoadingState, EmptyState, ErrorState } from "@/components/teryaq/States";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { useMemo, useState } from "react";
import { getTradingProfit, ApiError, type TradingProfitMovement } from "@/lib/api";

export const Route = createFileRoute("/trading/")({
  component: TradingDashboard,
});

type DailyRow = {
  dateKey: string;
  displayDate: string;
  sales: number;
  cost: number;
  grossProfit: number;
  rowCount: number;
};

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))} د.ل`;
}

function formatNumber(value?: number | null) {
  if (value == null) return "غير متوفر";
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatPercent(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("ar-LY", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function localDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function getPresetRange(range: string) {
  const today = new Date();
  if (range === "week") {
    return {
      dateFrom: localDate(subDays(today, 6)),
      dateTo: localDate(today),
    };
  }
  if (range === "month") {
    return {
      dateFrom: localDate(startOfMonth(today)),
      dateTo: localDate(today),
    };
  }
  return {
    dateFrom: localDate(today),
    dateTo: localDate(today),
  };
}

function movementTitle(row: TradingProfitMovement) {
  return row.tradingUser || row.description || row.kind || "غير محدد";
}

function formatDisplayDate(value?: string | null) {
  if (!value) return "بدون تاريخ";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar-LY");
}

function formatMovementBusinessDateTime(dateValue?: string | null, timeValue?: string | null) {
  const displayDate = formatDisplayDate(dateValue);
  if (!timeValue) return displayDate;

  const timeMatch = String(timeValue).match(/(\d{2}:\d{2})(?::\d{2})?/);
  return timeMatch ? `${displayDate} ${timeMatch[1]}` : displayDate;
}

function movementSubtitle(row: TradingProfitMovement) {
  return formatDisplayDate(row.date);
}

function dateKey(value?: string | null) {
  return value ? String(value).slice(0, 10) : "";
}

function buildDailyRows(movements: TradingProfitMovement[]): DailyRow[] {
  const map = new Map<string, DailyRow>();

  for (const row of movements) {
    const key = dateKey(row.date) || "unknown";
    const existing = map.get(key) || {
      dateKey: key,
      displayDate: key === "unknown" ? "بدون تاريخ" : formatDisplayDate(key),
      sales: 0,
      cost: 0,
      grossProfit: 0,
      rowCount: 0,
    };

    existing.sales += toNumber(row.amount);
    existing.cost += toNumber(row.cost);
    existing.grossProfit += toNumber(row.profit);
    existing.rowCount += 1;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function isMultiDay(dateFrom: string, dateTo: string) {
  return dateFrom !== dateTo;
}

function freshnessDifference(data: Awaited<ReturnType<typeof getTradingProfit>> | undefined) {
  const official = toNumber(data?.reconciliation?.officialRevenue ?? data?.summary?.revenue);
  const actual = toNumber(data?.reconciliation?.actualRevenue ?? data?.actualRevenue?.netRevenue);
  return {
    official,
    actual,
    difference: actual - official,
  };
}

function latestRevenueMovement(data: Awaited<ReturnType<typeof getTradingProfit>> | undefined) {
  const rows = data?.actualMovements || [];
  return rows[0] || null;
}

function TradingDashboard() {
  const today = useMemo(() => localDate(new Date()), []);
  const [range, setRange] = useState("today");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);

  const queryDates = useMemo(() => {
    if (range === "custom") return { dateFrom: customFrom, dateTo: customTo };
    return getPresetRange(range);
  }, [customFrom, customTo, range]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["trading", "summary", queryDates.dateFrom, queryDates.dateTo],
    queryFn: () => getTradingProfit(queryDates),
  });

  const apiError = error as ApiError | null;
  const summary = data?.summary || {};
  const movements = data?.movements || [];
  const dailyRows = useMemo(() => buildDailyRows(movements), [movements]);
  const margin = toNumber(summary.revenue) > 0 ? (toNumber(summary.grossProfit) / toNumber(summary.revenue)) * 100 : null;
  const freshness = freshnessDifference(data);
  const shouldShowFreshnessWarning = freshness.difference > 1;
  const shouldShowConservativeDifference = freshness.difference < -1;
  const latestMovement = latestRevenueMovement(data);
  const latestMovementTime = latestMovement?.movementHasRealTime
    ? formatMovementBusinessDateTime(latestMovement.date, latestMovement.movementCreatedAt)
    : null;

  return (
    <AppShell>
      <PageHeader
        title="المتاجرة والأرباح"
        subtitle="تقرير رسمي موحد للمبيعات والتكلفة ومجمل الربح"
      />

      <div className="mb-6 space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
              <CalendarDays className="size-4" />
            </span>
            <SegmentedTabs
              options={[
                { id: "today", label: "اليوم" },
                { id: "week", label: "الأسبوع" },
                { id: "month", label: "الشهر" },
                { id: "custom", label: "فترة مخصصة" },
              ]}
              value={range}
              onChange={setRange}
            />
          </div>

          {range === "custom" ? (
            <CompactDateRange
              dateFrom={customFrom}
              dateTo={customTo}
              onChangeFrom={setCustomFrom}
              onChangeTo={setCustomTo}
              onRefresh={() => refetch()}
            />
          ) : (
            <div className="flex justify-end">
              <ActionButton
                label={isFetching ? "جاري التحديث" : "تحديث"}
                icon={RefreshCw}
                variant="outline"
                onClick={() => refetch()}
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingState rows={4} />
        ) : isError ? (
          <ErrorState
            description={apiError?.message || "تعذر تحميل بيانات المتاجرة والأرباح"}
            onRetry={() => refetch()}
          />
        ) : !data ? (
          <EmptyState
            title="لا توجد بيانات متاحة"
            description="لم يرجع النظام أي بيانات متاجرة رسمية للفترة المختارة."
          />
        ) : (
          <div className="space-y-5">
            <KPIGrid>
              <KPICard label="المبيعات" value={formatMoney(summary.revenue)} icon={BarChart3} tone="info" />
              <KPICard label="تكلفة المبيعات" value={formatMoney(summary.costOfGoods)} icon={DollarSign} tone="default" />
              <KPICard label="مجمل الربح" value={formatMoney(summary.grossProfit)} icon={TrendingUp} tone="success" />
              <KPICard label="هامش مجمل الربح" value={formatPercent(margin)} icon={Percent} tone="default" />
            </KPIGrid>

            {shouldShowFreshnessWarning ? (
              <section className="card-surface border-warning/40 bg-warning/10 p-3 text-[12px] leading-6">
                <div className="mb-2 flex items-center gap-2 font-black text-warning">
                  <AlertTriangle className="size-4" />
                  <span>قد لا تكون بيانات المتاجرة محدثة بالكامل</span>
                </div>
                <div className="grid gap-1 text-muted-foreground sm:grid-cols-2">
                  <span>إجمالي المبيعات الرسمي: {formatMoney(freshness.official)}</span>
                  <span>إجمالي حركات الإيراد الحالية: {formatMoney(freshness.actual)}</span>
                  <span>الفرق: {formatMoney(freshness.difference)}</span>
                  <span>آخر حركة إيراد: {latestMovementTime || formatDisplayDate(latestMovement?.date)}</span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  يعتمد ملخص الأرباح الرسمي على جدول المتاجرة في المحاسب 3، وقد يتأخر تحديثه عن أحدث حركات الإيراد.
                </p>
              </section>
            ) : shouldShowConservativeDifference ? (
              <section className="card-surface border-border p-3 text-[12px] leading-6 text-muted-foreground">
                توجد فروقات بين إجمالي المبيعات الرسمي وحركات الإيراد الحالية للفترة المختارة. لم يتم اعتبار جدول المتاجرة غير محدث تلقائيًا لأن المصدرين لا يمثلان دائمًا نفس المفهوم المحاسبي.
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black">تفاصيل المتاجرة حسب الفترة</h2>
                  <p className="text-[11px] text-muted-foreground">صفوف رسمية مجمعة حسب المستخدم أو فترة العمل.</p>
                </div>
                <StatusBadge label={`${formatNumber(movements.length)} صف`} tone="info" />
              </div>

              {movements.length ? (
                <div className="space-y-2">
                  {movements.map((row, index) => (
                    <CompactListCard
                      key={`${row.referenceNo || index}-${row.tradingUser || row.description || ""}`}
                      title={movementTitle(row)}
                      subtitle={movementSubtitle(row)}
                      value={formatMoney(row.amount)}
                      meta={`مجمل الربح: ${formatMoney(row.profit)} · تكلفة المبيعات: ${formatMoney(row.cost)}`}
                      icon={Package}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="لا توجد تفاصيل للفترة"
                  description="لا توجد صفوف متاجرة رسمية للفترة المختارة."
                />
              )}
            </section>

            {isMultiDay(queryDates.dateFrom, queryDates.dateTo) && dailyRows.length > 1 ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black">أرباح الأيام</h2>
                    <p className="text-[11px] text-muted-foreground">تجميع يومي للصفوف الرسمية في الفترة المختارة.</p>
                  </div>
                  <StatusBadge label={`${dailyRows.length.toLocaleString("ar-LY")} يوم`} tone="info" />
                </div>
                <div className="space-y-2">
                  {dailyRows.map((row) => (
                    <CompactListCard
                      key={row.dateKey}
                      title={row.displayDate}
                      subtitle={`المبيعات: ${formatMoney(row.sales)} · تكلفة المبيعات: ${formatMoney(row.cost)}`}
                      value={formatMoney(row.grossProfit)}
                      meta={`${row.rowCount.toLocaleString("ar-LY")} صف رسمي`}
                      icon={row.grossProfit >= 0 ? TrendingUp : Package}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
