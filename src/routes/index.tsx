import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  Users,
  Truck,
  PackageX,
  CalendarClock,
  Boxes,
  ScanSearch,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { EmptyState } from "@/components/teryaq/States";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getRevenueDetails, 
  getInventorySummary,
} from "@/lib/api";
import { useMemo } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة — Teryaq" },
      { name: "description", content: "لوحة مؤشرات الصيدلية: الإيراد، الأرباح، الحركات والمخزون." },
      { property: "og:title", content: "نظرة عامة — Teryaq" },
      { property: "og:description", content: "لوحة مؤشرات الصيدلية: الإيراد، الأرباح، الحركات والمخزون." },
    ],
  }),
  component: Index,
});

const QUICK_ACTIONS = [
  { label: "إيراد اليوم", icon: Wallet, to: "/revenue" },
  { label: "حسابات الزبائن", icon: Users, to: "/accounts/customers" },
  { label: "حسابات الموردين", icon: Truck, to: "/accounts/suppliers" },
  { label: "المخزون", icon: Boxes, to: "/items/stock" },
  { label: "تتبع صنف", icon: ScanSearch, to: "/items/track" },
  { label: "المتاجرة والأرباح", icon: BarChart3, to: "/profit-reports/trading" },
] as const;

function Index() {
  const queryClient = useQueryClient();
  
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Use the same logic as Revenue page for Today's Revenue
  const { data: revenue, isLoading: loadingRev } = useQuery({
    queryKey: ["revenue", todayStr, todayStr],
    queryFn: () => getRevenueDetails({ dateFrom: todayStr, dateTo: todayStr }),
  });

  const { data: inventorySummary, isLoading: loadingInventorySummary } = useQuery({
    queryKey: ["inventorySummary"],
    queryFn: () => getInventorySummary(),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "...";
    return new Intl.NumberFormat("ar-LY").format(val);
  };

  const renderValue = (isLoading: boolean, value: string | number | undefined, suffix = "") => {
    if (isLoading) return "جاري التحميل...";
    if (value === undefined) return "غير متاح حاليًا";
    return `${typeof value === 'number' ? formatCurrency(value) : value} ${suffix}`;
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-1">
        <PageHeader title="نظرة عامة" />
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <RotateCcw className="size-3.5" />
          تحديث
        </button>
      </div>

      <section className="space-y-2.5">
        <Link to="/revenue" className="block">
          <KPICard
            label="إيراد اليوم"
            value={renderValue(loadingRev, revenue?.summary?.netRevenue)}
            hint={revenue?.summary?.netRevenue !== undefined ? "د.ل" : undefined}
            tone="info"
            icon={Wallet}
          />
        </Link>
        
        <KPIGrid>
          <Link to="/items/out-of-stock" className="block">
            <KPICard
              label="أصناف نفدت"
              value={isLoadingAll(loadingInventorySummary) ? "جاري التحميل..." : (inventorySummary?.outOfStockCount !== undefined ? String(inventorySummary.outOfStockCount) : "غير متاح حاليًا")}
              hint="صنف"
              tone="danger"
              icon={PackageX}
            />
          </Link>
          <Link to="/items/expiry" className="block">
            <KPICard
              label="قرب الانتهاء"
              value={isLoadingAll(loadingInventorySummary) ? "جاري التحميل..." : (inventorySummary?.expiryCount !== undefined ? String(inventorySummary.expiryCount) : "غير متاح حاليًا")}
              hint="صنف"
              tone="danger"
              icon={CalendarClock}
            />
          </Link>
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
        <EmptyState 
          title="سيتم ربط آخر الحركات لاحقًا" 
          description="بيانات الحركات المباشرة قيد التطوير"
        />
      </section>
    </AppShell>
  );
}

function isLoadingAll(...states: boolean[]) {
  return states.some(s => s);
}
