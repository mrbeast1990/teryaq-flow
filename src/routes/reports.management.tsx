import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Banknote, CalendarDays, CreditCard, Package, ReceiptText, RefreshCw, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, getAnalyticsManagementReport, type ManagementReportMetric } from "@/lib/api";

export const Route = createFileRoute("/reports/management")({
  head: () => ({
    meta: [{ title: "تقرير الإدارة - Teryaq" }],
  }),
  component: ManagementReportPage,
});

type Preset = "today" | "yesterday" | "week" | "month" | "custom";

const PRESETS = [
  { id: "today", label: "اليوم" },
  { id: "yesterday", label: "أمس" },
  { id: "week", label: "الأسبوع" },
  { id: "month", label: "الشهر" },
  { id: "custom", label: "فترة مخصصة" },
];

const METRIC_ICONS: Record<string, typeof Package> = {
  inventoryCost: Package,
  debtors: Users,
  creditors: CreditCard,
  cash: Banknote,
  expenses: ReceiptText,
};

const METRIC_DESTINATIONS: Partial<Record<string, "/accounts/customers" | "/accounts/suppliers">> = {
  debtors: "/accounts/customers",
  creditors: "/accounts/suppliers",
};

function inputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetRange(preset: Preset) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  if (preset === "yesterday") {
    start.setDate(today.getDate() - 1);
    end.setDate(today.getDate() - 1);
  }
  if (preset === "week") {
    start.setDate(today.getDate() - 6);
  }
  if (preset === "month") {
    start.setDate(1);
  }
  return { dateFrom: inputDate(start), dateTo: inputDate(end) };
}

function formatCurrency(value?: number | null) {
  if (value == null) return "غير متاح";
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))} د.ل`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ar-LY");
}

function ManagementReportPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customRange, setCustomRange] = useState(presetRange("month"));
  const activeRange = useMemo(() => (preset === "custom" ? customRange : presetRange(preset)), [customRange, preset]);

  const query = useQuery({
    queryKey: ["analytics-management-report", activeRange.dateFrom, activeRange.dateTo],
    queryFn: () => getAnalyticsManagementReport(activeRange),
  });

  const metrics = query.data?.metrics || [];
  const unavailableCount = metrics.filter((metric) => metric.status !== "available").length;

  return (
    <AppShell>
      <PageHeader
        title="تقرير الإدارة"
        subtitle="ملخص إداري مختصر من مصادر موثوقة فقط."
        actions={<ActionButton label="تحديث" icon={RefreshCw} onClick={() => query.refetch()} disabled={query.isFetching} />}
      />

      <div className="space-y-4">
        <section className="card-surface p-3">
          <SectionHeader title="فترة المصاريف" />
          <div className="space-y-3">
            <SegmentedTabs options={PRESETS} value={preset} onChange={(id) => setPreset(id as Preset)} />
            {preset === "custom" ? (
              <CompactDateRange
                dateFrom={customRange.dateFrom}
                dateTo={customRange.dateTo}
                onChangeFrom={(dateFrom) => setCustomRange((current) => ({ ...current, dateFrom }))}
                onChangeTo={(dateTo) => setCustomRange((current) => ({ ...current, dateTo }))}
                onRefresh={() => query.refetch()}
              />
            ) : (
              <p className="text-[12px] text-muted-foreground">
                الفترة المحددة: {formatDate(activeRange.dateFrom)} - {formatDate(activeRange.dateTo)}
              </p>
            )}
          </div>
        </section>

        {query.isLoading ? <LoadingState label="جاري تحميل تقرير الإدارة..." /> : null}
        {query.error instanceof ApiError ? <ErrorState title="تعذر تحميل تقرير الإدارة" description={query.error.message} /> : null}

        {!query.isLoading && !query.error ? (
          <section className="space-y-3">
            <SectionHeader
              title="المؤشرات"
              action={query.data?.generatedAt ? `آخر تحديث: ${formatDate(query.data.generatedAt)}` : undefined}
            />
            {unavailableCount > 0 ? (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-[12px] text-warning-foreground">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>بعض المؤشرات غير متاحة لأن مصدرها المحاسبي غير مثبت بما يكفي لعرض رقم إداري موثوق.</p>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>
            {metrics.length === 0 ? <EmptyState title="لا توجد مؤشرات" description="لم يرجع الخادم مؤشرات قابلة للعرض." /> : null}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function MetricCard({ metric }: { metric: ManagementReportMetric }) {
  const Icon = METRIC_ICONS[metric.key] || Package;
  const available = metric.status === "available";
  const destination = available ? METRIC_DESTINATIONS[metric.key] : undefined;
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-muted-foreground">{metric.title}</p>
          <p className={`num mt-1 text-[22px] font-extrabold ${available ? "text-foreground" : "text-muted-foreground"}`}>
            {available ? formatCurrency(metric.value) : "غير متاح"}
          </p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {metric.count != null ? <span>{new Intl.NumberFormat("ar-LY").format(metric.count)} سجل</span> : null}
        {metric.source ? <span>{metric.source}</span> : null}
        {!available && metric.reason ? <span>{metric.reason}</span> : null}
      </div>
    </>
  );

  if (destination) {
    return (
      <Link
        to={destination}
        className="card-surface block p-3 transition-colors hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="card-surface p-3">
      {content}
    </article>
  );
}
