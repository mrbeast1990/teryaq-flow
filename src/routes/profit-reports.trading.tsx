import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { PageHeader } from "@/components/teryaq/PageHeader";

export const Route = createFileRoute("/profit-reports/trading")({
  head: () => ({
    meta: [{ title: "المتاجرة والأرباح - Teryaq" }],
  }),
  component: TradingProfitChoicePage,
});

function TradingProfitChoicePage() {
  return (
    <AppShell>
      <PageHeader
        title="المتاجرة والأرباح"
        subtitle="اختر بين الربح الرسمي المسجل في المحاسب والربح التحليلي المحسوب داخل Teryaq Flow."
      />

      <div className="space-y-3">
        <CompactListCard
          title="أرباح حسب المحاسب"
          subtitle="الربح الرسمي المسجل في المنظومة"
          icon={BarChart3}
          to="/profit-reports/trading/accountant"
          wrapText
        />
        <CompactListCard
          title="أرباح حسب Teryaq Flow"
          subtitle="ربح تحليلي محسوب من حركات البيع وتكلفة وحدة البيع"
          icon={TrendingUp}
          to="/profit-reports/trading/flow"
          wrapText
        />
      </div>
    </AppShell>
  );
}
