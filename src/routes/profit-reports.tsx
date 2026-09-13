import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, PackageSearch } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { PageHeader } from "@/components/teryaq/PageHeader";

export const Route = createFileRoute("/profit-reports")({
  head: () => ({
    meta: [{ title: "تقارير الأرباح - Teryaq" }],
  }),
  component: ProfitReportsPage,
});

function ProfitReportsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/profit-reports") {
    return <Outlet />;
  }

  return (
    <AppShell>
      <PageHeader
        title="تقارير الأرباح"
        subtitle="مدخل واحد للتحليل الربحي الرسمي والتحليلي داخل Teryaq Flow."
      />

      <div className="space-y-3">
        <CompactListCard
          title="تحليل ربحية الأصناف"
          subtitle="تحليل ربح كل صنف حسب حركات البيع والتكلفة"
          icon={PackageSearch}
          to="/profit-reports/items"
          wrapText
        />
        <CompactListCard
          title="المتاجرة والأرباح"
          subtitle="متابعة الأرباح الرسمية والتحليلية"
          icon={BarChart3}
          to="/profit-reports/trading"
          wrapText
        />
      </div>
    </AppShell>
  );
}
