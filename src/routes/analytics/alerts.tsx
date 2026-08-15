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
        title="تنبيهات الإدارة"
        subtitle="إشعارات هامة حول العمليات والمخزون"
      />

      <div className="space-y-8 pb-8">
        <div>
          <SectionHeader title="تصنيفات التنبيهات" />
          <div className="grid gap-2 sm:grid-cols-2">
            <CompactListCard
              title="النواقص"
              subtitle="الأصناف التي قاربت على النفاد أو نفدت"
              icon={Package2}
              to="/items/out-of-stock"
            />
            <CompactListCard
              title="الصلاحية"
              subtitle="الأصناف القريبة من انتهاء الصلاحية"
              icon={ShieldAlert}
              to="/items/expiry"
            />
            <CompactListCard
              title="تغير أسعار الشراء"
              subtitle="تنبيهات حول ارتفاع تكلفة الأصناف"
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
