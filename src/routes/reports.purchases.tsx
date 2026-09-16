import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, FileText, Search, ShoppingBag, Truck, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, getPurchasesReport, type ReportInvoiceRow } from "@/lib/api";

export const Route = createFileRoute("/reports/purchases")({
  head: () => ({
    meta: [{ title: "تقرير المشتريات - Teryaq" }],
  }),
  component: PurchaseReportPage,
});

const PAGE_SIZE = 50;

type PeriodMode = "month" | "range";

function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0);
  return { dateFrom: localDateInput(start), dateTo: localDateInput(end) };
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

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : undefined;
}

function PurchaseReportPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [month, setMonth] = useState(monthInput());
  const [range, setRange] = useState({ dateFrom: monthRange(monthInput()).dateFrom, dateTo: monthRange(monthInput()).dateTo });
  const [search, setSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    periodMode: "month" as PeriodMode,
    month: monthInput(),
    dateFrom: monthRange(monthInput()).dateFrom,
    dateTo: monthRange(monthInput()).dateTo,
    search: "",
  });
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<ReportInvoiceRow | null>(null);

  const activeRange = useMemo(() => {
    if (periodMode === "month") return monthRange(month);
    return range;
  }, [month, periodMode, range]);

  const query = useQuery({
    queryKey: ["reports", "purchases", appliedFilters, supplierSearch, page],
    queryFn: () =>
      getPurchasesReport({
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        search: supplierSearch || appliedFilters.search || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const rows = query.data?.rows || [];
  const summary = query.data?.summary;
  const totalCount = Number(summary?.movementCount || 0);
  const pageSize = Number(query.data?.pageSize || PAGE_SIZE);
  const hasNext = page * pageSize < totalCount;
  const totalPurchases = Number(summary?.totalAmount || 0);
  const supplierPayments = Number(summary?.supplierPaymentTotal || 0);
  const periodDifference = Number(summary?.periodDifference || totalPurchases - supplierPayments);

  const applyFilters = () => {
    setPage(1);
    setSupplierSearch("");
    setAppliedFilters({
      periodMode,
      month,
      dateFrom: activeRange.dateFrom,
      dateTo: activeRange.dateTo,
      search: search.trim(),
    });
  };

  if (selectedInvoice) {
    return (
      <AppShell>
        <InvoiceDetailsView
          type="purchase"
          movementNo={String(selectedInvoice.movementNo)}
          displayMovementNo={selectedInvoice.invoiceNo ? String(selectedInvoice.invoiceNo) : undefined}
          onBack={() => setSelectedInvoice(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="تقرير المشتريات" subtitle="لوحة تحليلية لفواتير الشراء وسدادات الموردين ضمن الفترة المختارة." />

      <div className="space-y-4">
        <div className="card-surface space-y-3 p-3">
          <SegmentedTabs
            value={periodMode}
            onChange={(value) => setPeriodMode(value as PeriodMode)}
            options={[
              { id: "month", label: "شهر محدد" },
              { id: "range", label: "نطاق تاريخ" },
            ]}
          />
          {periodMode === "month" ? (
            <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
              الشهر
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
              />
            </label>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
                من تاريخ
                <input
                  type="date"
                  value={range.dateFrom}
                  onChange={(event) => setRange((current) => ({ ...current, dateFrom: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
                />
              </label>
              <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
                إلى تاريخ
                <input
                  type="date"
                  value={range.dateTo}
                  onChange={(event) => setRange((current) => ({ ...current, dateTo: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
                />
              </label>
            </div>
          )}
          <SearchInput placeholder="بحث اختياري برقم الفاتورة أو المورد..." value={search} onChange={setSearch} />
          <ActionButton label="تحديث التقرير" icon={Search} onClick={applyFilters} />
        </div>

        {query.isLoading && page === 1 ? <LoadingState rows={5} /> : null}
        {query.isError ? <ErrorState description={getErrorMessage(query.error)} onRetry={() => query.refetch()} /> : null}

        {!query.isError ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MetricCard title="إجمالي المشتريات" value={formatCurrency(totalPurchases)} icon={ShoppingBag} />
              <MetricCard title="عدد فواتير الشراء" value={totalCount.toLocaleString("ar-LY")} icon={FileText} />
              <MetricCard title="عدد الموردين" value={Number(summary?.supplierCount || 0).toLocaleString("ar-LY")} icon={Truck} />
              <MetricCard title="سدادات الموردين" value={formatCurrency(supplierPayments)} icon={WalletCards} />
            </div>

            <div className="card-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-muted-foreground">فرق حركة الفترة</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">المشتريات - سدادات الموردين</p>
                </div>
                <p className="text-[20px] font-black text-primary">{formatCurrency(periodDifference)}</p>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[14px] font-black">أكبر الموردين شراءً</h2>
                {supplierSearch ? <ActionButton label="إلغاء اختيار المورد" variant="outline" onClick={() => { setSupplierSearch(""); setPage(1); }} /> : null}
              </div>
              {(query.data?.topSuppliers || []).length ? (
                <div className="space-y-2">
                  {(query.data?.topSuppliers || []).map((supplier) => (
                    <button
                      type="button"
                      key={`${supplier.supplierId}-${supplier.supplierName}`}
                      onClick={() => {
                        setSupplierSearch(supplier.supplierName || "");
                        setPage(1);
                      }}
                      className="card-surface flex w-full items-center justify-between gap-3 p-3 text-right transition hover:bg-secondary/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-black">{supplier.supplierName || "مورد غير محدد"}</p>
                        <p className="text-[11px] text-muted-foreground">{Number(supplier.movementCount || 0).toLocaleString("ar-LY")} فاتورة</p>
                      </div>
                      <p className="shrink-0 text-[13px] font-black text-primary">{formatCurrency(supplier.totalAmount)}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="لا توجد بيانات موردين" description="لا توجد مشتريات ضمن الفترة أو البحث الحالي." icon={Truck} />
              )}
            </section>

            <section className="space-y-2">
              <h2 className="px-1 text-[14px] font-black">المشتريات حسب اليوم</h2>
              {(query.data?.daily || []).length ? (
                <div className="space-y-2">
                  {(query.data?.daily || []).map((day) => (
                    <div key={day.date} className="card-surface flex items-center justify-between gap-3 p-3">
                      <div>
                        <p className="text-[13px] font-black">{formatDate(day.date)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {Number(day.movementCount || 0).toLocaleString("ar-LY")} فاتورة · {Number(day.supplierCount || 0).toLocaleString("ar-LY")} مورد
                        </p>
                      </div>
                      <p className="text-[13px] font-black text-primary">{formatCurrency(day.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-[14px] font-black">تفاصيل فواتير الشراء</h2>
                  <p className="text-[11px] text-muted-foreground">
                    الصفحة <span className="num">{page}</span>
                    {supplierSearch ? ` · المورد: ${supplierSearch}` : ""}
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <ShoppingBag className="size-4" />
                </span>
              </div>

              {query.isLoading || query.isFetching ? (
                <LoadingState rows={6} />
              ) : !rows.length ? (
                <EmptyState title="لا توجد فواتير شراء" description="لا توجد نتائج مطابقة للفترة أو البحث الحالي." icon={FileText} />
              ) : (
                <div className="space-y-2">
                  {rows.map((row) => (
                    <PurchaseRowCard key={`${row.movementNo}-${row.invoiceNo}`} row={row} onOpen={() => setSelectedInvoice(row)} />
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <ActionButton label="السابق" variant="outline" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))} />
                <ActionButton label="التالي" variant="outline" disabled={!hasNext || query.isFetching} onClick={() => setPage((value) => value + 1)} />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: ReactNode; icon: typeof ShoppingBag }) {
  return (
    <div className="card-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground">{title}</p>
          <p className="mt-1 text-[18px] font-black">{value}</p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  );
}

function PurchaseRowCard({ row, onOpen }: { row: ReportInvoiceRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-surface block w-full p-3 text-right transition hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-black">{row.personName || "مورد غير محدد"}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatDate(row.date)} · حركة #{row.movementNo}
            {row.invoiceNo ? ` · فاتورة #${row.invoiceNo}` : ""}
          </p>
          {row.movementType ? <p className="mt-1 text-[11px] text-muted-foreground">{row.movementType}</p> : null}
        </div>
        <div className="shrink-0 text-left">
          <p className="text-[14px] font-black text-primary">{formatCurrency(row.total)}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
            تفاصيل
            <ChevronLeft className="size-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
