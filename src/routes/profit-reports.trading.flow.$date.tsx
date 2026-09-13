import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { KPICard } from "@/components/teryaq/KPICard";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, getAnalyticsProfitSummary, type AnalyticsProfitSummaryDay } from "@/lib/api";

export const Route = createFileRoute("/profit-reports/trading/flow/$date")({
  head: ({ params }) => ({
    meta: [{ title: `تفاصيل أرباح ${params.date} - Teryaq` }],
  }),
  component: FlowProfitDayPage,
});

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

function ReconciliationNote({ day }: { day: AnalyticsProfitSummaryDay }) {
  const periodRevenue = sum((day.periods || []).map((period) => period.revenue));
  const periodProfit = sum((day.periods || []).map((period) => period.profit));
  const revenueDifference = periodRevenue - Number(day.revenue || 0);
  const profitDifference = periodProfit - Number(day.profit || 0);
  const ok = Math.abs(revenueDifference) <= 0.01 && Math.abs(profitDifference) <= 0.01;

  return (
    <div className={`rounded-lg border p-3 text-[12px] leading-6 ${ok ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
      {ok ? (
        <p className="font-bold">تطابق التجميع: مجموع الفترات يساوي إجمالي اليوم للإيراد وربح Teryaq Flow.</p>
      ) : (
        <>
          <p className="font-bold">يوجد فرق تجميعي يحتاج مراجعة.</p>
          <p>فرق الإيراد: {formatMoney(revenueDifference)}</p>
          <p>فرق الربح: {formatMoney(profitDifference)}</p>
        </>
      )}
    </div>
  );
}

function FlowProfitDayPage() {
  const { date } = Route.useParams();
  const query = useQuery({
    queryKey: ["analytics", "profit-summary", date, date],
    queryFn: () => getAnalyticsProfitSummary({ dateFrom: date, dateTo: date }),
  });

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const day = query.data?.days?.find((row) => row.date === date) || query.data?.days?.[0] || null;

  return (
    <AppShell>
      <PageHeader
        title={`تفاصيل أرباح ${formatDateLabel(date)}`}
        subtitle="تقسيم الإيراد وربح Teryaq Flow حسب الفترات المسجلة في النظام."
        actions={
          <div className="flex gap-2">
            <ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => query.refetch()} />
            <Link to="/profit-reports/trading/flow" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold">
              <ArrowRight className="size-4" />
              رجوع
            </Link>
          </div>
        }
      />

      {query.isLoading ? (
        <LoadingState rows={6} />
      ) : query.isError ? (
        <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
      ) : !day ? (
        <EmptyState title="لا توجد بيانات لهذا اليوم" description="لم يتم العثور على حركات بيع لهذا اليوم." />
      ) : (
        <div className="space-y-4 pb-8">
          <KPIGrid>
            <KPICard label="الإيراد" value={formatMoney(day.revenue)} tone="info" />
            <KPICard label="ربح Teryaq Flow" value={formatMoney(day.profit)} tone="success" />
            <KPICard label="التكلفة" value={formatMoney(day.cost)} tone="default" />
            <KPICard label="هامش الربح" value={formatPercent(day.margin)} tone="default" />
          </KPIGrid>

          <ReconciliationNote day={day} />

          <section className="space-y-2">
            <div>
              <h2 className="text-sm font-black">الفترات</h2>
              <p className="text-[11px] text-muted-foreground">ربح كل فترة محسوب من حركات تلك الفترة نفسها، وليس توزيعا نسبيا.</p>
            </div>

            {(day.periods || []).length ? (
              <div className="space-y-2">
                {(day.periods || []).map((period, index) => (
                  <CompactListCard
                    key={`${period.sellerId ?? "period"}-${index}`}
                    title={period.sellerName || "غير محدد"}
                    subtitle={`الإيراد: ${formatMoney(period.revenue)} · التكلفة: ${formatMoney(period.cost)} · الحركات: ${Number(period.movementCount || 0).toLocaleString("ar-LY")}`}
                    value={formatMoney(period.profit)}
                    meta="ربح Teryaq Flow"
                    valueTone={Number(period.profit || 0) >= 0 ? "positive" : "negative"}
                    wrapText
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد فترات" description="لا توجد فترات مسجلة لهذا اليوم." />
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
