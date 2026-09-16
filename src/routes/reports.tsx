import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, ClipboardList, Printer, ShoppingBag, WalletCards } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "التقارير - Teryaq" },
      { name: "description", content: "مدخل التقارير الرئيسي في Teryaq Flow." },
    ],
  }),
  component: ReportsHubPage,
});

function ReportsHubPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/reports") {
    return <Outlet />;
  }

  return (
    <AppShell>
      <PageHeader
        title="التقارير"
        subtitle="مدخل واحد للتقارير الربحية والإدارية والتشغيلية."
      />

      <div className="space-y-4">
        <SectionHeader title="التقارير المتاحة" />
        <div className="space-y-2">
          <CompactListCard
            title="تقارير الأرباح"
            subtitle="ربحية الأصناف والمتاجرة والأرباح من الهيكل الحالي"
            icon={BarChart3}
            to="/profit-reports"
            wrapText
          />
          <CompactListCard
            title="تقرير الإدارة"
            subtitle="ملخص إداري مختصر للبضاعة، المدين، الدائن، النقدية والمصاريف"
            icon={ClipboardList}
            to="/reports/management"
            wrapText
          />
          <CompactListCard
            title="المقبوضات والسدادات"
            subtitle="مقبوضات الزبائن وسدادات الموردين بدون ربط تخميني بالفواتير"
            icon={WalletCards}
            to="/payments"
            wrapText
          />
          <CompactListCard
            title="تقرير المشتريات"
            subtitle="تحليل المشتريات وسدادات الموردين حسب الفترة والمورد واليوم"
            icon={ShoppingBag}
            to="/reports/purchases"
            wrapText
          />
          <CompactListCard
            title="التقارير والطباعة"
            subtitle="تقارير تشغيلية ومالية قابلة للطباعة مع إعدادات الطباعة الحالية"
            icon={Printer}
            to="/reports/printing"
            wrapText
          />
        </div>
      </div>
    </AppShell>
  );
}
