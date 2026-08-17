import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  CalendarClock,
  FileText,
  PackageX,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import {
  ApiError,
  getCustomers,
  getInventory,
  getPurchasesReport,
  getSalesReport,
  getSuppliers,
  getTradingProfit,
  type AccountPerson,
  type ItemInfo,
  type ReportInvoiceRow,
} from "@/lib/api";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "مركز التقارير — Teryaq" },
      { name: "description", content: "تقارير مالية وتشغيلية قابلة للطباعة من بيانات Teryaq الحقيقية." },
    ],
  }),
  component: ReportsPage,
});

type ReportType =
  | "sales"
  | "purchases"
  | "customer-statement"
  | "supplier-statement"
  | "inventory"
  | "out-of-stock"
  | "expiry"
  | "trading";

const REPORTS: {
  id: ReportType;
  title: string;
  subtitle: string;
  icon: typeof FileText;
}[] = [
  { id: "sales", title: "تقرير المبيعات", subtitle: "فواتير البيع حسب الفترة مع فتح الفاتورة", icon: Receipt },
  { id: "purchases", title: "تقرير المشتريات", subtitle: "فواتير الشراء حسب الفترة مع فتح الفاتورة", icon: ShoppingBag },
  { id: "customer-statement", title: "كشف حساب زبون", subtitle: "حركات الزبون والفواتير والسدادات", icon: Users },
  { id: "supplier-statement", title: "كشف حساب مورد", subtitle: "حركات المورد والفواتير والمدفوعات", icon: Truck },
  { id: "inventory", title: "تقرير المخزون", subtitle: "تقرير كامل عند الطلب دون إبطاء التصفح", icon: Boxes },
  { id: "out-of-stock", title: "تقرير الأصناف النافدة", subtitle: "الأصناف التشغيلية النشطة ذات الرصيد صفر أو أقل", icon: PackageX },
  { id: "expiry", title: "تقرير الصلاحية", subtitle: "منتهي أو قريب الصلاحية حسب الباقة المختارة", icon: CalendarClock },
  { id: "trading", title: "تقرير المتاجرة والأرباح", subtitle: "أرقام رسمية من The_Profit فقط", icon: TrendingUp },
];

const EXPIRY_BUCKETS = [
  { id: "expired", label: "منتهي" },
  { id: "0-30", label: "خلال 30 يوم" },
  { id: "31-60", label: "31-60 يوم" },
  { id: "61-90", label: "61-90 يوم" },
] as const;

function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ar-LY");
}

function formatCurrency(value?: number | null) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
  return (
    <span className="num inline-block whitespace-nowrap" dir="ltr">
      {formatted} د.ل
    </span>
  );
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function reportPeriodLabel(dateFrom: string, dateTo: string) {
  return dateFrom === dateTo ? formatDate(dateFrom) : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : undefined;
}

function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("sales");

  return (
    <AppShell>
      <PageHeader title="مركز التقارير" />

      <div className="space-y-6">
        <div className="no-print">
          <SectionHeader title="التقارير المتاحة" />
          <div className="grid gap-2 sm:grid-cols-2">
            {REPORTS.map((report) => {
              const Icon = report.icon;
              const active = activeReport === report.id;
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setActiveReport(report.id)}
                  className={`card-surface flex min-h-20 items-start gap-3 p-3 text-right transition-colors ${
                    active ? "border-primary bg-primary-soft/50" : "hover:bg-secondary/50"
                  }`}
                >
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-black">{report.title}</span>
                    <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">{report.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeReport === "sales" && <InvoiceReport kind="sales" />}
        {activeReport === "purchases" && <InvoiceReport kind="purchases" />}
        {activeReport === "customer-statement" && <StatementReport kind="customer" />}
        {activeReport === "supplier-statement" && <StatementReport kind="supplier" />}
        {activeReport === "inventory" && <InventoryReport kind="inventory" />}
        {activeReport === "out-of-stock" && <InventoryReport kind="out-of-stock" />}
        {activeReport === "expiry" && <InventoryReport kind="expiry" />}
        {activeReport === "trading" && <TradingReport />}
      </div>
    </AppShell>
  );
}

function ReportPaper({
  title,
  filter,
  children,
  actions,
}: {
  title: string;
  filter: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const generatedAt = new Date();

  return (
    <section className="report-print-area card-surface overflow-hidden">
      <div className="border-b border-border bg-secondary/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-black text-primary">صيدلية الترياق الشافي</p>
            <h2 className="mt-1 text-lg font-black">{title}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">{filter}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">تاريخ الطباعة: {generatedAt.toLocaleString("ar-LY")}</p>
          </div>
          <div className="no-print flex flex-wrap gap-2">{actions}</div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DateRangeControls({
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
}: {
  dateFrom: string;
  dateTo: string;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[11px] font-bold text-muted-foreground">
        من
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => onDateFrom(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
        />
      </label>
      <label className="text-[11px] font-bold text-muted-foreground">
        إلى
        <input
          type="date"
          value={dateTo}
          onChange={(event) => onDateTo(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
        />
      </label>
    </div>
  );
}

function InvoiceReport({ kind }: { kind: "sales" | "purchases" }) {
  const today = useMemo(() => localDateInput(), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState("");
  const [request, setRequest] = useState<{ dateFrom: string; dateTo: string; search: string } | null>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ReportInvoiceRow[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<{ movementNo: string; type: "sales" | "purchase" } | null>(null);
  const pageSize = 100;

  const query = useQuery({
    queryKey: ["reports", kind, request, page],
    enabled: Boolean(request),
    queryFn: () => {
      const params = { ...(request || { dateFrom, dateTo, search }), page, pageSize };
      return kind === "sales" ? getSalesReport(params) : getPurchasesReport(params);
    },
  });

  const summary = query.data?.summary;
  const totalRows = summary?.movementCount ?? rows.length;
  const displayedRows = rows;
  const canLoadMore = Boolean(summary && rows.length < summary.movementCount);

  useEffect(() => {
    if (!query.data) return;
    if (page === 1) {
      setRows(query.data.rows || []);
      return;
    }
    setRows((previous) => {
      const incoming = query.data.rows || [];
      const known = new Set(previous.map((row) => `${row.rowNo}-${row.movementNo}-${row.invoiceNo}`));
      const nextRows = incoming.filter((row) => !known.has(`${row.rowNo}-${row.movementNo}-${row.invoiceNo}`));
      return nextRows.length ? [...previous, ...nextRows] : previous;
    });
  }, [page, query.data]);

  function runReport() {
    setPage(1);
    setRows([]);
    setSelectedInvoice(null);
    setRequest({ dateFrom, dateTo, search: search.trim() });
  }

  function loadMore() {
    setPage((current) => current + 1);
  }

  if (selectedInvoice) {
    return <InvoiceDetailsView type={selectedInvoice.type} movementNo={selectedInvoice.movementNo} onBack={() => setSelectedInvoice(null)} />;
  }

  const title = kind === "sales" ? "تقرير المبيعات" : "تقرير المشتريات";
  const invoiceType = kind === "sales" ? "sales" : "purchase";
  const errorMessage = getErrorMessage(query.error);

  return (
    <div className="space-y-4">
      <div className="no-print card-surface space-y-3 p-3">
        <DateRangeControls dateFrom={dateFrom} dateTo={dateTo} onDateFrom={setDateFrom} onDateTo={setDateTo} />
        <SearchInput value={search} onChange={setSearch} placeholder={kind === "sales" ? "بحث برقم الفاتورة أو الزبون" : "بحث برقم الفاتورة أو المورد"} />
        <ActionButton label="إنشاء التقرير" icon={RefreshCw} onClick={runReport} disabled={query.isFetching} />
      </div>

      {!request && <EmptyState title="اختر الفترة ثم أنشئ التقرير" description="لن يتم تحميل بيانات الفواتير حتى تطلب التقرير صراحة." />}
      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState description={errorMessage} onRetry={() => query.refetch()} />}
      {request && query.data && (
        <ReportPaper
          title={title}
          filter={`الفترة: ${reportPeriodLabel(request.dateFrom, request.dateTo)}${request.search ? ` · بحث: ${request.search}` : ""}`}
          actions={
            <>
              <ActionButton label="طباعة" icon={Printer} onClick={() => window.print()} variant="outline" />
              {canLoadMore && <ActionButton label="تحميل المزيد" icon={RefreshCw} onClick={loadMore} variant="outline" disabled={query.isFetching} />}
            </>
          }
        >
          <SummaryStrip
            items={[
              { label: "عدد الحركات", value: formatNumber(summary?.movementCount) },
              { label: "الإجمالي", value: formatCurrency(summary?.totalAmount) },
              { label: "المتوسط", value: formatCurrency(summary?.averageAmount) },
            ]}
          />
          <InvoiceRowsTable rows={displayedRows} invoiceType={invoiceType} onOpen={(movementNo) => setSelectedInvoice({ type: invoiceType, movementNo })} />
          {displayedRows.length < totalRows && (
            <p className="no-print mt-3 text-center text-[11px] font-bold text-muted-foreground">
              يعرض {formatNumber(displayedRows.length)} من {formatNumber(totalRows)} حركة. استخدم تحميل المزيد قبل طباعة كامل الفترة.
            </p>
          )}
        </ReportPaper>
      )}
    </div>
  );
}

function InvoiceRowsTable({
  rows,
  invoiceType,
  onOpen,
}: {
  rows: ReportInvoiceRow[];
  invoiceType: "sales" | "purchase";
  onOpen: (movementNo: string) => void;
}) {
  if (!rows.length) return <EmptyState title="لا توجد فواتير ضمن هذا النطاق" description="غيّر الفترة أو البحث ثم حاول مرة أخرى." />;

  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full min-w-[720px] text-right text-[12px]">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>رقم الحركة</th>
            <th>رقم الفاتورة</th>
            <th>{invoiceType === "sales" ? "الزبون" : "المورد"}</th>
            <th>نوع الحركة</th>
            <th>الأصناف</th>
            <th>الإجمالي</th>
            <th className="no-print">فتح</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.movementNo}-${row.invoiceNo}-${index}`}>
              <td>{formatDate(row.date)}</td>
              <td className="num">{row.movementNo}</td>
              <td className="num">{row.invoiceNo || "-"}</td>
              <td>{row.personName || "-"}</td>
              <td>{row.movementType || "-"}</td>
              <td className="num">{formatNumber(row.itemCount)}</td>
              <td>{formatCurrency(row.total)}</td>
              <td className="no-print">
                <button
                  type="button"
                  onClick={() => onOpen(String(row.movementNo))}
                  className="rounded-lg bg-secondary px-2 py-1 text-[11px] font-bold hover:bg-primary-soft"
                >
                  عرض الفاتورة
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div className="mb-4 grid gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-secondary/40 p-3">
          <p className="text-[11px] font-bold text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-[15px] font-black">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatementReport({ kind }: { kind: "customer" | "supplier" }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AccountPerson | null>(null);
  const query = useQuery({
    queryKey: ["reports", kind, "accounts", search],
    queryFn: () => (kind === "customer" ? getCustomers({ search }) : getSuppliers({ search })),
  });
  const rows = kind === "customer" ? query.data?.customers || [] : query.data?.suppliers || [];
  const title = kind === "customer" ? "كشف حساب زبون" : "كشف حساب مورد";
  const errorMessage = getErrorMessage(query.error);

  return (
    <div className="space-y-4">
      <div className="no-print card-surface space-y-3 p-3">
        <SearchInput value={search} onChange={setSearch} placeholder={kind === "customer" ? "ابحث عن زبون" : "ابحث عن مورد"} />
        {query.isLoading && <LoadingState rows={2} />}
        {query.isError && <ErrorState description={errorMessage} onRetry={() => query.refetch()} />}
        {!query.isLoading && rows.length > 0 && (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {rows.slice(0, 30).map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => setSelected(account)}
                className={`card-surface flex w-full items-center justify-between gap-3 p-3 text-right transition-colors hover:bg-secondary/50 ${
                  selected?.id === account.id ? "border-primary bg-primary-soft/40" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-black">{account.name}</span>
                  <span className="block text-[11px] text-muted-foreground">كود: {account.id}</span>
                </span>
                <span className="text-left text-[12px] font-black">{formatCurrency(account.currentBalance)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected && <EmptyState title={`اختر ${kind === "customer" ? "زبونًا" : "موردًا"} لعرض الكشف`} description="الحركات ستظهر من بيانات الحساب الحقيقية بعد الاختيار." />}
      {selected && (
        <ReportPaper
          title={title}
          filter={`${selected.name} · كود ${selected.id} · الرصيد الحالي ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(Number(selected.currentBalance || 0))} د.ل`}
          actions={<ActionButton label="طباعة" icon={Printer} onClick={() => window.print()} variant="outline" />}
        >
          <FinancialStatement type={kind} id={String(selected.id)} />
        </ReportPaper>
      )}
    </div>
  );
}

function InventoryReport({ kind }: { kind: "inventory" | "out-of-stock" | "expiry" }) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<(typeof EXPIRY_BUCKETS)[number]["id"]>("expired");
  const [request, setRequest] = useState<{ search: string; bucket: string } | null>(null);
  const query = useQuery({
    queryKey: ["reports", kind, request],
    enabled: Boolean(request),
    queryFn: () => {
      if (kind === "out-of-stock") return getInventory({ filter: "out-of-stock", search: request?.search, limit: "all" });
      if (kind === "expiry") return getInventory({ filter: `expiry-${request?.bucket || "expired"}`, search: request?.search, limit: "all" });
      return getInventory({ search: request?.search, limit: "all" });
    },
  });

  const title = kind === "inventory" ? "تقرير المخزون" : kind === "out-of-stock" ? "تقرير الأصناف النافدة" : "تقرير الصلاحية";
  const filterLabel = kind === "expiry" ? EXPIRY_BUCKETS.find((item) => item.id === request?.bucket)?.label || "منتهي" : "كل النتائج المطابقة";
  const errorMessage = getErrorMessage(query.error);
  const rows = query.data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="no-print card-surface space-y-3 p-3">
        {kind === "expiry" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EXPIRY_BUCKETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setBucket(option.id)}
                className={`rounded-lg border px-3 py-2 text-[12px] font-black transition-colors ${
                  bucket === option.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-card"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو الكود أو الباركود" />
        <ActionButton label="تحميل التقرير الكامل" icon={RefreshCw} onClick={() => setRequest({ search: search.trim(), bucket })} disabled={query.isFetching} />
      </div>

      {!request && <EmptyState title="حمّل التقرير عند الحاجة فقط" description="التقارير الكبيرة لا تُحمّل تلقائيًا حفاظًا على سرعة التطبيق." />}
      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState description={errorMessage} onRetry={() => query.refetch()} />}
      {request && query.data && (
        <ReportPaper
          title={title}
          filter={`${filterLabel}${request.search ? ` · بحث: ${request.search}` : ""}`}
          actions={<ActionButton label="طباعة" icon={Printer} onClick={() => window.print()} variant="outline" />}
        >
          <SummaryStrip
            items={[
              { label: "عدد السجلات المحملة", value: formatNumber(rows.length) },
              { label: "إجمالي النتائج", value: formatNumber(query.data.totalCount ?? rows.length) },
              { label: "مصدر البيانات", value: "Teryaq API" },
            ]}
          />
          <InventoryTable rows={rows} showExpiry={kind === "expiry"} />
        </ReportPaper>
      )}
    </div>
  );
}

function InventoryTable({ rows, showExpiry }: { rows: ItemInfo[]; showExpiry?: boolean }) {
  if (!rows.length) return <EmptyState title="لا توجد أصناف مطابقة" description="لا توجد نتائج حقيقية لهذا التقرير حسب الفلتر الحالي." />;

  return (
    <div className="overflow-x-auto">
      <table className="report-table w-full min-w-[760px] text-right text-[12px]">
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكود</th>
            <th>الباركود</th>
            <th>الكمية</th>
            <th>آخر شراء</th>
            <th>سعر البيع</th>
            {showExpiry && <th>الصلاحية</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.id}-${row.barcode}-${index}`}>
              <td>{row.name}</td>
              <td className="num">{row.code || row.id || "-"}</td>
              <td className="num">{row.barcode || "-"}</td>
              <td>{row.formattedQuantity || formatNumber(row.rawQuantity)}</td>
              <td>{row.purchasePrice == null ? "-" : formatCurrency(row.purchasePrice)}</td>
              <td>{row.salePrice == null ? "-" : formatCurrency(row.salePrice)}</td>
              {showExpiry && <td>{row.expiryDate ? `${formatDate(row.expiryDate)}${row.daysRemaining != null ? ` · ${formatNumber(row.daysRemaining)} يوم` : ""}` : "-"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradingReport() {
  const today = useMemo(() => localDateInput(), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [request, setRequest] = useState<{ dateFrom: string; dateTo: string } | null>(null);
  const query = useQuery({
    queryKey: ["reports", "trading", request],
    enabled: Boolean(request),
    queryFn: () => getTradingProfit(request || { dateFrom, dateTo }),
  });
  const errorMessage = getErrorMessage(query.error);
  const summary = query.data?.officialSummary || query.data?.summary;

  return (
    <div className="space-y-4">
      <div className="no-print card-surface space-y-3 p-3">
        <DateRangeControls dateFrom={dateFrom} dateTo={dateTo} onDateFrom={setDateFrom} onDateTo={setDateTo} />
        <ActionButton label="إنشاء التقرير الرسمي" icon={RefreshCw} onClick={() => setRequest({ dateFrom, dateTo })} disabled={query.isFetching} />
      </div>

      {!request && <EmptyState title="اختر الفترة لإنشاء تقرير المتاجرة" description="المصدر الرسمي هو The_Profit عبر /api/trading-profit." />}
      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState description={errorMessage} onRetry={() => query.refetch()} />}
      {request && query.data && (
        <ReportPaper
          title="تقرير المتاجرة والأرباح الرسمي"
          filter={`الفترة: ${reportPeriodLabel(request.dateFrom, request.dateTo)} · المصدر: ${summary?.sourceTable || "The_Profit"}`}
          actions={<ActionButton label="طباعة" icon={Printer} onClick={() => window.print()} variant="outline" />}
        >
          <SummaryStrip
            items={[
              { label: "المبيعات", value: formatCurrency(summary?.revenue) },
              { label: "تكلفة المبيعات", value: formatCurrency(summary?.costOfGoods) },
              { label: "مجمل الربح", value: formatCurrency(summary?.grossProfit) },
            ]}
          />
          <div className="rounded-lg border border-border bg-secondary/30 p-3 text-[12px] leading-6 text-muted-foreground">
            هذا التقرير يستخدم تعريفات المتاجرة الرسمية فقط: المبيعات = SUM(Trading_Income)، التكلفة = SUM(Trading_Income - Trading_Profit)،
            والربح = SUM(Trading_Profit). لا تُستخدم تحليلات ربحية الأصناف التقديرية هنا.
          </div>
        </ReportPaper>
      )}
    </div>
  );
}
