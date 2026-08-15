import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { AnalyticsNav } from "@/components/teryaq/analytics/AnalyticsNav";

export const Route = createFileRoute("/analytics/")({
  head: () => ({
    meta: [
      { title: "مركز التحليلات — Teryaq" },
      { name: "description", content: "رؤية أعمق لبيانات الصيدلية واتخاذ القرار." },
      { property: "og:title", content: "مركز التحليلات — Teryaq" },
      { property: "og:description", content: "رؤية أعمق لبيانات الصيدلية واتخاذ القرار." },
    ],
  }),
  component: AnalyticsHomePage,
});

function AnalyticsHomePage() {
  return (
    <AppShell>
      <PageHeader
        title="مركز التحليلات"
        subtitle="رؤية أعمق لبيانات الصيدلية واتخاذ القرار"
      />
      <div className="pb-8">
        <AnalyticsNav />
      </div>
    </AppShell>
  );
}
