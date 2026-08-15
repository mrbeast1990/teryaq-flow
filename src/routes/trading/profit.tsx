import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BadgeDollarSign, Package, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { useState } from "react";
import { ApiError, getTradingProfit } from "@/lib/api";

export const Route = createFileRoute("/trading/profit")({
  component: ProfitSummaryPage,
});

function formatMoney(value?: number | null) {
  if (value == null) return "غير متوفر";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))} د.ل`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ar-LY").format(value);
}

function ProfitSummaryPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["trading", "profit-summary", dateFrom, dateTo],
    queryFn: () => getTradingProfit({ dateFrom, dateTo }),
  });

  const apiError = error as ApiError | null;
  const summary = data?.summary || {};
  const movements = data?.movements || [];

  return (
    <AppShell>
      <PageHeader
        title="ملخص الأرباح"
        subtitle="تحليل رسمي لمجمل الربح من مصدر The_Profit"
        showBack
      />

      <div className="mb-6">
        <CompactDateRange
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={setDateFrom}
          onChangeTo={setDateTo}
          onRefresh={() => refetch()}
        />
      </div>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState
          description={apiError?.message || "تعذر تحميل ملخص الأرباح"}
          onRetry={() => refetch()}
        />
      ) : !data ? (
        <EmptyState title="لا توجد بيانات" description="لا توجد بيانات أرباح رسمية للفترة المختارة." />
      ) : (
        <div className="space-y-6">
          <KPIGrid>
            <KPICard label="المبيعات" value={formatMoney(summary.revenue)} icon={BadgeDollarSign} tone="info" />
            <KPICard label="تكلفة المبيعات" value={formatMoney(summary.costOfGoods)} icon={Package} tone="default" />
            <KPICard label="مجمل الربح" value={formatMoney(summary.grossProfit)} icon={TrendingUp} tone="success" />
            <KPICard label="صافي الربح" value={formatMoney(summary.netProfit)} icon={Wallet} tone="success" />
          </KPIGrid>

          {data.staleSource?.message ? (
            <div className="card-surface border-warning/40 bg-warning/10 p-3 text-[12px] font-semibold text-warning">
              {data.staleSource.message}
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black">صفوف The_Profit الرسمية</h2>
                <p className="text-[11px] text-muted-foreground">المبيعات والتكلفة والربح كما يرجعها Backend القديم</p>
              </div>
              <StatusBadge label={`${formatCount(movements.length)} صف`} tone="info" />
            </div>

            {movements.length ? (
              <div className="space-y-2">
                {movements.map((row, index) => (
                  <CompactListCard
                    key={`${row.referenceNo || index}-${row.tradingUser || ""}`}
                    title={row.tradingUser || row.description || "غير محدد"}
                    subtitle={row.date ? new Date(row.date).toLocaleDateString("ar-LY") : "بدون تاريخ"}
                    value={formatMoney(row.amount)}
                    meta={`الربح: ${formatMoney(row.profit)} · التكلفة: ${formatMoney(row.cost)}`}
                    icon={RefreshCw}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد صفوف" description="لم يرجع The_Profit صفوفًا رسمية للفترة المختارة." />
            )}
          </section>

          {isFetching ? <p className="text-center text-[11px] text-muted-foreground">يتم تحديث البيانات...</p> : null}
        </div>
      )}
    </AppShell>
  );
}
