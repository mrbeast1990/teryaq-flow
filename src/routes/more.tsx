import { createFileRoute } from "@tanstack/react-router";
import { Database, Info, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { DEMO_CONNECTION } from "@/lib/demo/dashboard";

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
  return (
    <AppShell>
      <PageHeader
        title="المزيد"
        action={
          <StatusBadge
            label={DEMO_CONNECTION.connected ? "متصل" : "غير متصل"}
            tone={DEMO_CONNECTION.connected ? "success" : "danger"}
          />
        }
      />
      <SectionHeader title="الإعدادات" />
      <div className="space-y-2">
        <CompactListCard
          title="مصدر البيانات"
          subtitle={`${DEMO_CONNECTION.name} · /api/status`}
          icon={Database}
        />
        <CompactListCard title="تفضيلات العرض" subtitle="الترتيب والفلاتر الافتراضية" icon={SlidersHorizontal} />
        <CompactListCard title="حول التطبيق" subtitle="Teryaq · المرحلة الأولى (واجهة فقط)" icon={Info} />
      </div>
    </AppShell>
  );
}