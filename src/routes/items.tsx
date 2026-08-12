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
      <PageHeader title="الأصناف" subtitle="إدارة المخزون وتتبع الحركة" />
      <div className="grid gap-2 sm:grid-cols-2">
        <CompactListCard
          title="المخزون"
          subtitle="أرصدة الأصناف الحالية"
          icon={Boxes}
          to="/items/stock"
        />
        <CompactListCard
          title="تتبع صنف"
          subtitle="حركة صنف تفصيلية"
          icon={ScanSearch}
          to="/items/track"
        />
        <CompactListCard
          title="أصناف نفدت"
          subtitle="رصيد صفر"
          icon={PackageX}
          to="/items/out-of-stock"
        />
        <CompactListCard
          title="انتهاء الصلاحية"
          subtitle="حسب تاريخ الصلاحية"
          icon={CalendarClock}
          to="/items/expiry"
        />
      </div>

    </AppShell>
  );
}