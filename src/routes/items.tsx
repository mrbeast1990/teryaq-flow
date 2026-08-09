import { createFileRoute } from "@tanstack/react-router";
import { Boxes, ScanSearch, PackageX, CalendarClock } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState } from "@/components/teryaq/States";

export const Route = createFileRoute("/items")({
  head: () => ({
    meta: [
      { title: "الأصناف — Teryaq" },
      { name: "description", content: "المخزون وتتبع الأصناف والنواقص وقرب انتهاء الصلاحية." },
      { property: "og:title", content: "الأصناف — Teryaq" },
      { property: "og:description", content: "المخزون وتتبع الأصناف والنواقص والصلاحية." },
    ],
  }),
  component: ItemsPage,
});

function ItemsPage() {
  return (
    <AppShell>
      <PageHeader title="الأصناف" subtitle="هيكل التنقل — المرحلة الأولى" />
      <div className="mb-3">
        <SearchInput placeholder="بحث عن صنف…" />
      </div>
      <SectionHeader title="الأقسام" />
      <div className="grid gap-2 sm:grid-cols-2">
        <CompactListCard title="المخزون" subtitle="أرصدة الأصناف الحالية" icon={Boxes} />
        <CompactListCard title="تتبع صنف" subtitle="حركة صنف تفصيلية" icon={ScanSearch} />
        <CompactListCard title="أصناف نفدت" subtitle="رصيد صفر" icon={PackageX} />
        <CompactListCard title="قرب الانتهاء" subtitle="حسب تاريخ الصلاحية" icon={CalendarClock} />
      </div>
      <div className="mt-4">
        <EmptyState
          title="لم يتم ربط البيانات بعد"
          description="ستظهر بيانات المخزون الفعلية بعد ربط الـ API."
        />
      </div>
    </AppShell>
  );
}