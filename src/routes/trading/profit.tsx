import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";

export const Route = createFileRoute("/trading/profit")({
  component: ProfitSummaryPage,
});

function ProfitSummaryPage() {
  return (
    <AppShell>
      <PageHeader 
        title="ملخص الأرباح" 
        subtitle="تحليل مفصل لمجمل الربح وهامش المتاجرة"
        showBack
      />

      <div className="space-y-4">
        <EmptyState 
          title="قيد التطوير"
          description="سيتم عرض ملخص الأرباح التفصيلي هنا فور توفر بيانات الـ API."
        />
      </div>
    </AppShell>
  );
}
