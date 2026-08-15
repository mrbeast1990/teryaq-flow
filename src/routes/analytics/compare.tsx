import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { EmptyState } from "@/components/teryaq/States";
import { CalendarDays, ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { SectionHeader } from "@/components/teryaq/SectionHeader";

export const Route = createFileRoute("/analytics/compare")({
  head: () => ({
    meta: [
      { title: "مقارنة الفترات — Teryaq" },
    ],
  }),
  component: ComparePeriodsPage,
});

function ComparePeriodsPage() {
  const [period1, setPeriod1] = useState({ from: "", to: "" });
  const [period2, setPeriod2] = useState({ from: "", to: "" });

  return (
    <AppShell>
      <PageHeader
        title="مقارنة الفترات"
        subtitle="مقارنة المبيعات والإيراد بين فترتين"
      />

      <div className="space-y-6 pb-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <SectionHeader title="الفترة الأولى" />
            <CompactDateRange
              dateFrom={period1.from}
              dateTo={period1.to}
              onChangeFrom={(v: string) => setPeriod1(prev => ({ ...prev, from: v }))}
              onChangeTo={(v: string) => setPeriod1(prev => ({ ...prev, to: v }))}
              onRefresh={() => {}}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <SectionHeader title="الفترة الثانية" />
            <CompactDateRange
              dateFrom={period2.from}
              dateTo={period2.to}
              onChangeFrom={(v: string) => setPeriod2(prev => ({ ...prev, from: v }))}
              onChangeTo={(v: string) => setPeriod2(prev => ({ ...prev, to: v }))}
              onRefresh={() => {}}
            />
          </div>
        </div>

        <div className="flex justify-center py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
        </div>

        <EmptyState
          title="بانتظار تحديد الفترات"
          description="اختر الفترات الزمنية للمقارنة لعرض التحليلات المالية."
          icon={CalendarDays}
        />
      </div>
    </AppShell>
  );
}
