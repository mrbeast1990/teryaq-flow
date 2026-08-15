import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { TrendingUp, Info } from "lucide-react";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { useState } from "react";

export const Route = createFileRoute("/analytics/item-profit")({
  head: () => ({
    meta: [
      { title: "تحليل ربحية الأصناف — Teryaq" },
    ],
  }),
  component: ItemProfitabilityPage,
});

function ItemProfitabilityPage() {
  const [activeTab, setActiveTab] = useState("top-profit");

  const options = [
    { id: "top-profit", label: "الأعلى ربحًا" },
    { id: "low-profit", label: "الأقل ربحًا" },
    { id: "top-sales", label: "الأعلى مبيعًا" },
  ];

  return (
    <AppShell>
      <PageHeader
        title="تحليل ربحية الأصناف"
        subtitle="تحليل أداء الأصناف المالي وتقدير الأرباح"
      />

      <div className="mb-6 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
        <div className="flex gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            تحليل تقديري مبني على تكلفة الصنف المسجلة بالحركات، ولا يمثل إجمالي الربح المحاسبي الرسمي.
          </p>
        </div>
      </div>

      <SegmentedTabs
        options={options}
        value={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        <EmptyState
          title="لا توجد بيانات تحليلية"
          description="بانتظار معالجة البيانات من النظام لعرض إحصائيات الربحية."
          icon={TrendingUp}
        />
      </div>
    </AppShell>
  );
}
