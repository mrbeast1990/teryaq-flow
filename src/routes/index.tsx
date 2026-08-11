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
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState } from "@/components/teryaq/States";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getRevenueDetails, 
  getTradingProfit, 
  getCustomerBalances, 
  getSupplierPayables, 
  getOutOfStock, 
  getLowStock, 
  getExpiryItems,
  ApiError
} from "@/lib/api";
import { useState, useMemo } from "react";
import { format } from "date-fns";

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
  const queryClient = useQueryClient();
  
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Use the same logic as Revenue page for Today's Revenue
  const { data: revenue, isLoading: loadingRev } = useQuery({
    queryKey: ["revenue", todayStr, todayStr],
    queryFn: () => getRevenueDetails({ dateFrom: todayStr, dateTo: todayStr }),
    enabled: range === "today",
  });

  const { data: profit, isLoading: loadingProfit } = useQuery({
    queryKey: ["profit", todayStr, todayStr],
    queryFn: () => getTradingProfit({ dateFrom: todayStr, dateTo: todayStr }),
    enabled: range === "today",
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomerBalances(),
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSupplierPayables(),
  });

  const { data: outOfStock, isLoading: loadingOut } = useQuery({
    queryKey: ["outOfStock"],
    queryFn: () => getOutOfStock(),
  });

  const { data: lowStock, isLoading: loadingLow } = useQuery({
    queryKey: ["lowStock"],
    queryFn: () => getLowStock(),
  });

  const { data: expiry, isLoading: loadingExpiry } = useQuery({
    queryKey: ["expiryItems"],
    queryFn: () => getExpiryItems(),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const isUnavailable = range !== "today";

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "...";
    return new Intl.NumberFormat("ar-LY").format(val);
  };

  const renderValue = (isLoading: boolean, value: string | number | undefined, suffix = "") => {
    if (isUnavailable) return "غير متاح حاليًا";
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

      <div className="mb-4">
        <SegmentedTabs
          options={[
            { label: "اليوم", value: "today" },
            { label: "الأسبوع", value: "week" },
            { label: "الشهر", value: "month" },
          ]}
          value={range}
          onChange={setRange}
        />
      </div>

      <section className="space-y-2.5">
        <KPIGrid>
          <KPICard
            label="إيراد اليوم"
            value={renderValue(loadingRev, revenue?.summary?.netRevenue)}
            hint={revenue?.summary?.netRevenue !== undefined ? "د.ل" : undefined}
            tone="info"
            icon={Wallet}
          />
          <KPICard
            label="أرباح اليوم"
            value={renderValue(loadingProfit, profit?.profit)}
            hint={profit?.margin ? `هامش ${profit.margin}٪` : undefined}
            tone="success"
            icon={TrendingUp}
          />
          <KPICard
            label="عدد الحركات"
            value={renderValue(loadingRev, revenue?.summary?.movementCount)}
            hint={revenue?.summary?.movementCount !== undefined ? "حركة" : undefined}
            tone="default"
            icon={Receipt}
          />
          <KPICard
            label="أرصدة الزبائن"
            value={isLoadingAll(loadingCustomers) ? "جاري التحميل..." : (customers?.totalBalance !== undefined ? formatCurrency(customers.totalBalance) : "غير متاح حاليًا")}
            hint={customers?.count ? `${customers.count} زبون مدين` : "د.ل"}
            tone="default"
            icon={Users}
          />
        </KPIGrid>
        
        <KPIGrid>
          <KPICard
            label="مستحقات الموردين"
            value={isLoadingAll(loadingSuppliers) ? "جاري التحميل..." : (suppliers?.totalBalance !== undefined ? formatCurrency(suppliers.totalBalance) : "غير متاح حاليًا")}
            hint={suppliers?.count ? `${suppliers.count} مورد` : "د.ل"}
            tone="warning"
            icon={Truck}
          />
          <KPICard
            label="مخزون منخفض"
            value={isLoadingAll(loadingLow) ? "جاري التحميل..." : (lowStock?.count !== undefined ? lowStock.count : "غير متاح حاليًا")}
            hint="صنف"
            tone="warning"
            icon={PackageSearch}
          />
          <KPICard
            label="أصناف نفدت"
            value={isLoadingAll(loadingOut) ? "جاري التحميل..." : (outOfStock?.count !== undefined ? outOfStock.count : "غير متاح حاليًا")}
            hint="صنف"
            tone="danger"
            icon={PackageX}
          />
          <KPICard
            label="قرب الانتهاء"
            value={isLoadingAll(loadingExpiry) ? "جاري التحميل..." : (expiry?.count !== undefined ? expiry.count : "غير متاح حاليًا")}
            hint="صنف"
            tone="danger"
            icon={CalendarClock}
          />
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
