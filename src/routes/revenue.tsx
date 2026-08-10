import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, CreditCard, Users, ArrowDownLeft } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { LoadingState, ErrorState } from "@/components/teryaq/States";
import { getRevenueDetails } from "@/lib/api";

export const Route = createFileRoute("/revenue")({
  component: RevenuePage,
});

function RevenuePage() {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["revenue", { dateFrom, dateTo }],
    queryFn: () => getRevenueDetails({ dateFrom, dateTo }),
  });

  return (
    <AppShell>
      <PageHeader title="إيراد اليوم" />
      <div className="mb-6">
        <CompactDateRange
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={setDateFrom}
          onChangeTo={setDateTo}
          onRefresh={refetch}
        />
      </div>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <ErrorState description="تعذر تحميل تفاصيل الإيرادات." onRetry={refetch} />
      ) : data ? (
        <div className="space-y-6">
          <KPIGrid>
            <KPICard label="صافي الإيراد" value={data.summary.netFinalRevenue.toLocaleString()} icon={Wallet} tone="info" />
            <KPICard label="إجمالي المبيعات" value={data.summary.cashSales.toLocaleString()} icon={TrendingUp} tone="success" />
            <KPICard label="إلكتروني" value={data.summary.electronicPayments.toLocaleString()} icon={CreditCard} tone="info" />
            <KPICard label="المدينين" value={data.summary.debtorPayments.toLocaleString()} icon={Users} tone="warning" />
          </KPIGrid>

          <div className="space-y-2">
            {data.periods.map((period) => (
              <div key={period.periodName} className="card-surface p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[13px]">{period.periodName}</span>
                  <span className="font-bold text-[13px]">{period.total.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {period.sources.map((source) => (
                    <div key={source.name} className="flex justify-between items-center bg-secondary/50 p-2 rounded-lg">
                      <span className="text-[11px] font-semibold text-muted-foreground">{source.name}</span>
                      <span className={`text-[12px] font-bold ${source.total < 0 ? 'text-destructive' : ''}`}>
                        {source.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
