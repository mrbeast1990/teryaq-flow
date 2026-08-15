import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, DollarSign, Percent, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { DateRangeControl } from "@/components/teryaq/DateRangeControl";
import { LoadingState, EmptyState, ErrorState } from "@/components/teryaq/States";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { useState } from "react";
import { getTradingProfit, ApiError } from "@/lib/api";

export const Route = createFileRoute("/trading/")({
  component: TradingDashboard,
});

function formatCurrency(value?: number | null) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));

  return (
    <span className="num inline-block whitespace-nowrap" dir="ltr">
      {formatted} د.ل
    </span>
  );
}

function TradingDashboard() {
  const [dateRange, setDateRange] = useState("today");
  
  // Real API wiring (placeholder query for Phase 6)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trading", "summary", dateRange],
    queryFn: () => getTradingProfit({ 
      dateFrom: new Date().toISOString().split('T')[0], 
      dateTo: new Date().toISOString().split('T')[0] 
    }),
    enabled: false, // ZERO DEMO DATA: Do not fetch yet, or wait for Codex
  });

  const apiError = error as ApiError | null;

  return (
    <AppShell>
      <PageHeader 
        title="المتاجرة والأرباح" 
        subtitle="نظرة عامة على الأداء المالي للصيدلية"
      />

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DateRangeControl value={dateRange} onChange={setDateRange} />
          <ActionButton 
            label="تحديث البيانات" 
            icon={RefreshCw} 
            variant="outline" 
            onClick={() => refetch()}
          />
        </div>

        {isLoading ? (
          <LoadingState rows={4} />
        ) : isError ? (
          <ErrorState 
            description={apiError?.message || "تعذر تحميل بيانات الأرباح"} 
            onRetry={() => refetch()} 
          />
        ) : !data ? (
          <div className="space-y-6">
            <KPIGrid>
              <KPICard 
                label="المبيعات" 
                value="---" 
                icon={BarChart3} 
                tone="default"
              />
              <KPICard 
                label="تكلفة المبيعات" 
                value="---" 
                icon={DollarSign} 
                tone="default"
              />
              <KPICard 
                label="مجمل الربح" 
                value="---" 
                icon={TrendingUp} 
                tone="default"
              />
              <KPICard 
                label="هامش الربح" 
                value="---" 
                icon={Percent} 
                tone="default"
              />
            </KPIGrid>

            <EmptyState 
              title="لا توجد بيانات متاحة" 
              description="سيتم عرض مؤشرات الربحية فور ربطها ببيانات النظام الحقيقية."
            />
          </div>
        ) : (
          <div className="space-y-6">
             {/* Actual data mapping would go here */}
          </div>
        )}
      </div>
    </AppShell>
  );
}
