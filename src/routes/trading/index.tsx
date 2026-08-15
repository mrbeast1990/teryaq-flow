import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, Percent, RefreshCw, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { format, startOfMonth, subDays } from "date-fns";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { DateRangeControl } from "@/components/teryaq/DateRangeControl";
import { LoadingState, EmptyState, ErrorState } from "@/components/teryaq/States";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { useMemo, useState } from "react";
import { getTradingProfit, ApiError, type TradingProfitMovement } from "@/lib/api";

export const Route = createFileRoute("/trading/")({
  component: TradingDashboard,
});

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

function getDateRange(range: string) {
  const today = new Date();
  if (range === "week") {
    return {
      dateFrom: format(subDays(today, 6), "yyyy-MM-dd"),
      dateTo: format(today, "yyyy-MM-dd"),
    };
  }
  if (range === "month") {
    return {
      dateFrom: format(startOfMonth(today), "yyyy-MM-dd"),
      dateTo: format(today, "yyyy-MM-dd"),
    };
  }
  return {
    dateFrom: format(today, "yyyy-MM-dd"),
    dateTo: format(today, "yyyy-MM-dd"),
  };
}

function movementTitle(row: TradingProfitMovement) {
  return row.tradingUser || row.description || row.kind || "غير محدد";
}

function movementSubtitle(row: TradingProfitMovement) {
  const date = row.date ? new Date(row.date) : null;
  const displayDate = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("ar-LY") : "بدون تاريخ";
  return `${displayDate} · ${row.sourceTable || "The_Profit"}`;
}

function TradingDashboard() {
  const [dateRange, setDateRange] = useState("today");
  const queryDates = useMemo(() => getDateRange(dateRange), [dateRange]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["trading", "summary", queryDates.dateFrom, queryDates.dateTo],
    queryFn: () => getTradingProfit(queryDates),
  });

  const apiError = error as ApiError | null;
  const summary = data?.summary || {};
  const movements = data?.movements || [];
  const staleMessage = data?.staleSource?.message || null;

  return (
    <AppShell>
      <PageHeader
        title="المتاجرة والأرباح"
        subtitle="ملخص رسمي من جدول The_Profit في المحاسب"
      />

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DateRangeControl value={dateRange} onChange={setDateRange} />
          <ActionButton
            label={isFetching ? "جار التحديث" : "تحديث البيانات"}
            icon={RefreshCw}
            variant="outline"
            onClick={() => refetch()}
          />
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
            description="لم يرجع Backend أي بيانات متاجرة رسمية للفترة المختارة."
          />
        ) : (
          <div className="space-y-6">
            {staleMessage ? (
              <div className="card-surface border-warning/40 bg-warning/10 p-3 text-[12px] font-semibold text-warning">
                {staleMessage}
              </div>
            ) : null}

            <KPIGrid>
              <KPICard
                label="المبيعات"
                value={formatMoney(summary.revenue)}
                hint="The_Profit.Trading_Income"
                icon={BarChart3}
                tone="info"
              />
              <KPICard
                label="تكلفة المبيعات"
                value={formatMoney(summary.costOfGoods)}
                hint="Trading_Income - Trading_Profit"
                icon={DollarSign}
                tone="default"
              />
              <KPICard
                label="مجمل الربح"
                value={formatMoney(summary.grossProfit)}
                hint="The_Profit.Trading_Profit"
                icon={TrendingUp}
                tone="success"
              />
              <KPICard
                label="هامش الربح"
                value="غير متوفر"
                hint="لا يرجعه Backend حاليًا"
                icon={Percent}
                tone="default"
              />
            </KPIGrid>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black">تفاصيل المتاجرة الرسمية</h2>
                  <p className="text-[11px] text-muted-foreground">حسب المستخدم/الفترة من The_Profit</p>
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
                      meta={`الربح: ${formatMoney(row.profit)} · التكلفة: ${formatMoney(row.cost)}`}
                      icon={Package}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="لا توجد تفاصيل للفترة"
                  description="لا توجد صفوف رسمية في The_Profit لهذه الفترة."
                />
              )}
            </section>

            {data.reconciliation?.isSnapshotIncomplete ? (
              <section className="card-surface space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-warning" />
                  <h2 className="text-sm font-black">مقارنة مع الإيراد الفعلي</h2>
                </div>
                <p className="text-[12px] text-muted-foreground">
                  الإيراد الرسمي: {formatMoney(data.reconciliation.officialRevenue)} · الإيراد الفعلي:
                  {" "}{formatMoney(data.reconciliation.actualRevenue)} · الفرق:
                  {" "}{formatMoney(data.reconciliation.shortfall)}
                </p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
