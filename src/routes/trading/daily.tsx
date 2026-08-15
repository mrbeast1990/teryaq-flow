import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Package, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { useMemo, useState } from "react";
import { ApiError, getTradingProfit, type TradingProfitMovement } from "@/lib/api";

export const Route = createFileRoute("/trading/daily")({
  component: DailyProfitPage,
});

type DailyRow = {
  dateKey: string;
  displayDate: string;
  sales: number;
  cost: number;
  profit: number;
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

function dateKey(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function buildDailyRows(movements: TradingProfitMovement[]): DailyRow[] {
  const map = new Map<string, DailyRow>();
  for (const row of movements) {
    const key = dateKey(row.date) || "unknown";
    const existing = map.get(key) || {
      dateKey: key,
      displayDate: key === "unknown" ? "بدون تاريخ" : new Date(key).toLocaleDateString("ar-LY"),
      sales: 0,
      cost: 0,
      profit: 0,
      rowCount: 0,
    };
    existing.sales += toNumber(row.amount);
    existing.cost += toNumber(row.cost);
    existing.profit += toNumber(row.profit);
    existing.rowCount += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((left, right) => left.dateKey.localeCompare(right.dateKey));
}

function DailyProfitPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trading", "daily", dateFrom, dateTo],
    queryFn: () => getTradingProfit({ dateFrom, dateTo }),
  });

  const apiError = error as ApiError | null;
  const dailyRows = useMemo(() => buildDailyRows(data?.movements || []), [data?.movements]);

  return (
    <AppShell>
      <PageHeader
        title="أرباح الأيام"
        subtitle="تجميع يومي لصفوف The_Profit الرسمية"
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
        <LoadingState rows={5} />
      ) : isError ? (
        <ErrorState description={apiError?.message || "تعذر تحميل أرباح الأيام"} onRetry={() => refetch()} />
      ) : dailyRows.length ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[12px] font-bold text-muted-foreground">المصدر: The_Profit</p>
            <StatusBadge label={`${dailyRows.length.toLocaleString("ar-LY")} يوم`} tone="info" />
          </div>
          {dailyRows.map((row) => (
            <CompactListCard
              key={row.dateKey}
              title={row.displayDate}
              subtitle={`المبيعات: ${formatMoney(row.sales)} · التكلفة: ${formatMoney(row.cost)}`}
              value={formatMoney(row.profit)}
              meta={`${row.rowCount.toLocaleString("ar-LY")} صف رسمي`}
              icon={row.profit >= 0 ? TrendingUp : Package}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="لا توجد بيانات"
          description="لم يرجع The_Profit صفوفًا رسمية للفترة المختارة."
          icon={CalendarDays}
        />
      )}
    </AppShell>
  );
}
