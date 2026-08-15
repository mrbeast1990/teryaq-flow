import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, History, Package2, RefreshCw, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { getAnalyticsAlerts, ApiError, type AnalyticsAlertRow } from "@/lib/api";

export const Route = createFileRoute("/analytics/alerts")({
  head: () => ({
    meta: [{ title: "تنبيهات الإدارة — Teryaq" }],
  }),
  component: ManagementAlertsPage,
});

function alertDestination(row: AnalyticsAlertRow) {
  if (row.title.includes("نافدة")) return "/items/out-of-stock";
  if (row.title.includes("انتهاء") || row.title.includes("صلاحية")) return "/items/expiry";
  if (row.title.includes("سعر") || row.title.includes("شراء")) return "/analytics/prices";
  return undefined;
}

function alertIcon(row: AnalyticsAlertRow) {
  if (row.title.includes("نافدة")) return Package2;
  if (row.title.includes("انتهاء") || row.title.includes("صلاحية")) return ShieldAlert;
  if (row.title.includes("سعر") || row.title.includes("شراء")) return History;
  return AlertCircle;
}

function severityLabel(severity: string) {
  if (severity === "high") return "أولوية عالية";
  if (severity === "medium") return "أولوية متوسطة";
  if (severity === "low") return "أولوية منخفضة";
  return severity;
}

function ManagementAlertsPage() {
  const alertsQuery = useQuery({
    queryKey: ["analytics", "alerts"],
    queryFn: getAnalyticsAlerts,
  });

  const rows = alertsQuery.data?.rows || [];
  const errorMessage = alertsQuery.error instanceof ApiError || alertsQuery.error instanceof Error ? alertsQuery.error.message : undefined;

  return (
    <AppShell>
      <PageHeader
        title="مركز التنبيهات"
        subtitle="تنبيهات حقيقية من Teryaq SQL حول المخزون والصلاحية وأسعار الشراء."
        actions={<ActionButton label="تحديث" icon={RefreshCw} variant="outline" onClick={() => alertsQuery.refetch()} />}
      />

      <div className="space-y-6 pb-8">
        <div>
          <SectionHeader title="مسارات المتابعة" />
          <div className="grid grid-cols-2 gap-2">
            <CompactListCard title="نواقص" subtitle="الأصناف النافدة" icon={Package2} to="/items/out-of-stock" />
            <CompactListCard title="صلاحية" subtitle="الأصناف المنتهية والقريبة" icon={ShieldAlert} to="/items/expiry" />
            <CompactListCard title="تغير أسعار الشراء" subtitle="مراقبة أسعار الشراء" icon={History} to="/analytics/prices" />
          </div>
        </div>

        {alertsQuery.isLoading ? (
          <LoadingState rows={3} />
        ) : alertsQuery.isError ? (
          <ErrorState description={errorMessage} onRetry={() => alertsQuery.refetch()} />
        ) : !rows.length ? (
          <EmptyState
            title="لا توجد تنبيهات حالية"
            description="كل شيء يبدو جيدًا. التنبيهات الجديدة ستظهر هنا فور رجوعها من الـAPI."
            icon={AlertCircle}
          />
        ) : (
          <section className="space-y-2">
            <SectionHeader title="التنبيهات الحالية" />
            {rows.map((row) => (
              <CompactListCard
                key={`${row.title}-${row.value}`}
                title={row.title}
                subtitle={row.message || severityLabel(row.severity)}
                value={row.value == null ? undefined : new Intl.NumberFormat("ar-LY").format(row.value)}
                meta={severityLabel(row.severity)}
                icon={alertIcon(row)}
                to={alertDestination(row)}
              />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
