import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { LayoutDashboard } from "lucide-react";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { SectionHeader } from "@/components/teryaq/SectionHeader";

export const Route = createFileRoute("/analytics/manager")({
  head: () => ({
    meta: [
      { title: "لوحة المدير — Teryaq" },
    ],
  }),
  component: ManagerDashboardPage,
});

function ManagerDashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="لوحة المدير"
        subtitle="نظرة تنفيذية شاملة على أداء الصيدلية"
      />

      <div className="space-y-8 pb-8">
        <div>
          <SectionHeader title="الملخص التشغيلي" />
          <KPIGrid>
            <KPICard title="المبيعات" loading={false} />
            <KPICard title="الإيرادات" loading={false} />
            <KPICard title="النواقص" loading={false} />
            <KPICard title="الصلاحية" loading={false} />
          </KPIGrid>
        </div>

        <div>
          <SectionHeader title="ملخص المتاجرة" />
          <KPIGrid>
            <KPICard title="تكلفة المبيعات" loading={false} />
            <KPICard title="مجمل الربح" loading={false} />
          </KPIGrid>
        </div>

        <EmptyState
          title="بانتظار البيانات"
          description="سيتم عرض الملخص التنفيذي والتنبيهات هنا فور توفرها."
          icon={LayoutDashboard}
        />
        
        {/* 
          Future Sections:
          - operational summary
          - revenue/trading summary
          - shortages
          - expiry alerts
          - topItems (hide if empty)
        */}
      </div>
    </AppShell>
  );
}
