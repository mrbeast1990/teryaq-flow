import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ClipboardList } from "lucide-react";
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
  return (
    <AppShell>
      <PageHeader
        title="التقارير"
        subtitle="مدخل واحد للتقارير الربحية وتقرير الإدارة."
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
        </div>
      </div>
    </AppShell>
  );
}
