import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Users,
  Truck,
  PackageSearch,
  PackageX,
  CalendarClock,
  Boxes,
  ScanSearch,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { DateRangeControl } from "@/components/teryaq/DateRangeControl";
import { DEMO_KPIS_PRIMARY, DEMO_KPIS_SECONDARY, DEMO_RECENT_MOVEMENTS } from "@/lib/demo/dashboard";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة — Teryaq" },
      { name: "description", content: "لوحة مؤشرات الصيدلية: الإيراد، الأرباح، الحركات والمخزون." },
      { property: "og:title", content: "نظرة عامة — Teryaq" },
      { property: "og:description", content: "لوحة مؤشرات الصيدلية اليومية بنظرة سريعة." },
    ],
  }),
  component: Index,
});

const ICONS = {
  wallet: Wallet,
  "trending-up": TrendingUp,
  receipt: Receipt,
  users: Users,
  truck: Truck,
  "package-search": PackageSearch,
  "package-x": PackageX,
  "calendar-clock": CalendarClock,
} as const;

const QUICK_ACTIONS = [
  { label: "إيراد اليوم", icon: Wallet, to: "/revenue" },
  { label: "حسابات الزبائن", icon: Users, to: "/accounts" },
  { label: "حسابات الموردين", icon: Truck, to: "/accounts" },
  { label: "المخزون", icon: Boxes, to: "/items" },
  { label: "تتبع صنف", icon: ScanSearch, to: "/items" },
  { label: "المتاجرة والأرباح", icon: BarChart3, to: "/revenue" },
] as const;

function Index() {
  const [range, setRange] = useState("today");

  return (
    <AppShell>
      <PageHeader title="نظرة عامة" subtitle="بيانات تجريبية للعرض فقط" />
      <div className="mb-3">
        <DateRangeControl value={range} onChange={setRange} />
      </div>

      <section className="space-y-2.5">
        <KPIGrid>
          {DEMO_KPIS_PRIMARY.map((kpi) => (
            <KPICard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              tone={kpi.tone}
              icon={ICONS[kpi.icon as keyof typeof ICONS]}
            />
          ))}
        </KPIGrid>
        <KPIGrid>
          {DEMO_KPIS_SECONDARY.map((kpi) => (
            <KPICard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              tone={kpi.tone}
              icon={ICONS[kpi.icon as keyof typeof ICONS]}
            />
          ))}
        </KPIGrid>
      </section>

      <section className="mt-5">
        <SectionHeader title="إجراءات سريعة" />
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
            <Link
              key={label}
              to={to}
              className="card-surface flex flex-col items-center gap-1.5 px-2 py-3 text-center transition-colors hover:bg-secondary/50"
            >
              <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <span className="text-[11.5px] font-bold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <SectionHeader title="آخر الحركات" />
        <div className="space-y-2">
          {DEMO_RECENT_MOVEMENTS.map((row) => (
            <CompactListCard
              key={row.id}
              title={row.title}
              subtitle={row.subtitle}
              value={row.value}
              meta={row.meta}
              icon={Receipt}
            />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
