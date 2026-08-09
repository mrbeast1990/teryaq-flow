import { createFileRoute } from "@tanstack/react-router";
import { Wallet, BarChart3, Receipt } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { EmptyState } from "@/components/teryaq/States";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "الإيرادات — Teryaq" },
      { name: "description", content: "تفاصيل الإيراد اليومي والمتاجرة والأرباح في Teryaq." },
      { property: "og:title", content: "الإيرادات — Teryaq" },
      { property: "og:description", content: "تفاصيل الإيراد والمتاجرة والأرباح." },
    ],
  }),
  component: RevenuePage,
});

function RevenuePage() {
  return (
    <AppShell>
      <PageHeader title="الإيرادات" subtitle="هيكل التنقل — المرحلة الأولى" />
      <SectionHeader title="الأقسام" />
      <div className="space-y-2">
        <CompactListCard title="تفاصيل الإيراد" subtitle="/api/revenue-details" icon={Wallet} />
        <CompactListCard title="المتاجرة والأرباح" subtitle="/api/trading-profit" icon={BarChart3} />
        <CompactListCard title="الفواتير" subtitle="مبيعات ومشتريات حسب رقم الحركة" icon={Receipt} />
      </div>
      <div className="mt-4">
        <EmptyState
          title="لم يتم ربط البيانات بعد"
          description="سيتم عرض الإيرادات الفعلية بعد ربط واجهة Teryaq SQL Connector."
        />
      </div>
    </AppShell>
  );
}