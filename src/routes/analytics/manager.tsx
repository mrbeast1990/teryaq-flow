import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { LayoutDashboard, BarChart3, Wallet, Package2, ShieldAlert, DollarSign, TrendingUp } from "lucide-react";
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
            <KPICard label="المبيعات" value="---" icon={BarChart3} />
            <KPICard label="الإيرادات" value="---" icon={Wallet} />
            <KPICard label="النواقص" value="---" icon={Package2} />
            <KPICard label="الصلاحية" value="---" icon={ShieldAlert} />
          </KPIGrid>
        </div>

        <div>
          <SectionHeader title="ملخص المتاجرة" />
          <KPIGrid>
            <KPICard label="تكلفة المبيعات" value="---" icon={DollarSign} />
            <KPICard label="مجمل الربح" value="---" icon={TrendingUp} />
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
