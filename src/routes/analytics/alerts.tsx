import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { AlertCircle, Package2, ShieldAlert, History } from "lucide-react";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { SectionHeader } from "@/components/teryaq/SectionHeader";

export const Route = createFileRoute("/analytics/alerts")({
  head: () => ({
    meta: [
      { title: "تنبيهات الإدارة — Teryaq" },
    ],
  }),
  component: ManagementAlertsPage,
});

function ManagementAlertsPage() {
  return (
    <AppShell>
      <PageHeader
        title="مركز التنبيهات"
        subtitle="إشعارات هامة حول العمليات والمخزون"
      />

      <div className="space-y-8 pb-8">
        <div>
          <SectionHeader title="تصنيفات التنبيهات" />
          <div className="grid grid-cols-2 gap-2">
            <CompactListCard
              title="نواقص"
              subtitle="الأصناف النافدة"
              icon={Package2}
              to="/items/out-of-stock"
            />
            <CompactListCard
              title="صلاحية"
              subtitle="الأصناف المنتهية"
              icon={ShieldAlert}
              to="/items/expiry"
            />
            <CompactListCard
              title="تغير أسعار الشراء"
              subtitle="مراقبة الأسعار"
              icon={History}
              to="/analytics/prices"
            />
          </div>
        </div>

        <EmptyState
          title="لا توجد تنبيهات حالية"
          description="كل شيء يبدو جيداً. التنبيهات الجديدة ستظهر هنا فور صدورها."
          icon={AlertCircle}
        />
      </div>
    </AppShell>
  );
}
