import { createFileRoute } from "@tanstack/react-router";
import { Database, FileText, Info, ReceiptText, SlidersHorizontal, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { TradingNav } from "@/components/teryaq/trading/TradingNav";
import { AnalyticsNav } from "@/components/teryaq/analytics/AnalyticsNav";
import { getSystemStatus } from "@/lib/api";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "المزيد — Teryaq" },
      { name: "description", content: "إعدادات التطبيق وحالة الاتصال بقاعدة البيانات." },
      { property: "og:title", content: "المزيد — Teryaq" },
      { property: "og:description", content: "إعدادات التطبيق وحالة الاتصال." },
    ],
  }),
  component: MorePage,
});

function MorePage() {
  const { data: status } = useQuery({
    queryKey: ["systemStatus"],
    queryFn: () => getSystemStatus(),
  });

  const connected = Boolean(status?.connected);
  const subtitle = status?.server
    ? `${status.database || "AlmohasebSQL"} · ${status.server}`
    : "/api/status";

  return (
    <AppShell>
      <PageHeader
        title="المزيد"
        actions={<StatusBadge label={connected ? "متصل" : "غير متصل"} tone={connected ? "success" : "danger"} />}
      />

      <div className="space-y-8">
        <AnalyticsNav />
        <TradingNav />

        <div>
          <SectionHeader title="الإعدادات" />
          <div className="space-y-2">
            <CompactListCard
              title="إدارة الاتصال"
              subtitle={subtitle}
              icon={Database}
              to="/settings/connection"
            />
            <CompactListCard title="مركز التقارير والطباعة" subtitle="تقارير مالية وتشغيلية قابلة للطباعة" icon={FileText} to="/reports" />
            <CompactListCard title="مركز الفواتير" subtitle="فواتير البيع والشراء والمردودات مع فتح تفاصيل الفاتورة" icon={ReceiptText} to="/invoices" />
            <CompactListCard title="المقبوضات والسدادات" subtitle="مقبوضات الزبائن وسدادات الموردين بدون ربط تخميني" icon={WalletCards} to="/payments" />
            <CompactListCard title="تفضيلات العرض" subtitle="الترتيب والفلاتر الافتراضية" icon={SlidersHorizontal} />
            <CompactListCard title="حول التطبيق" subtitle="Teryaq Flow · واجهة جديدة مرتبطة بـ Teryaq SQL Connector" icon={Info} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
