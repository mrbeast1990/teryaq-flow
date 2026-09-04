import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CreditCard, FileText, Printer, ReceiptText, Search, WalletCards } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { PrintFooter, PrintHeader } from "@/components/teryaq/print/PrintHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import {
  ApiError,
  getCustomerReceiptsReport,
  getRevenueMovementDetails,
  getSupplierPaymentsReport,
  type ReportPaymentRow,
} from "@/lib/api";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [{ title: "المقبوضات والسدادات — Teryaq" }],
  }),
  component: PaymentsCenterPage,
});

const PAGE_SIZE = 50;

type PaymentTab = "customer-receipts" | "supplier-payments";
type PaymentSelection = {
  row: ReportPaymentRow;
  tab: PaymentTab;
};
type InvoiceSelection = {
  type: "sales" | "purchase";
  movementNo: string;
};

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

function formatTime(value?: string | null) {
  if (!value) return null;
  const sqlDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  let date: Date;
  if (sqlDateTime) {
    const [, year, month, day, hour, minute] = sqlDateTime;
    date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("ar-LY", { hour: "numeric", minute: "2-digit" });
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

function PaymentsCenterPage() {
  const [tab, setTab] = useState<PaymentTab>("customer-receipts");
  const [dateFrom, setDateFrom] = useState(localDateInput());
  const [dateTo, setDateTo] = useState(localDateInput());
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: localDateInput(),
    dateTo: localDateInput(),
    search: "",
  });
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<PaymentSelection | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSelection | null>(null);

  const query = useQuery({
    queryKey: ["payments-center", tab, appliedFilters, page],
    queryFn: () => {
      const params = {
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        search: appliedFilters.search || undefined,
        page,
        pageSize: PAGE_SIZE,
      };
      return tab === "customer-receipts" ? getCustomerReceiptsReport(params) : getSupplierPaymentsReport(params);
    },
  });

  const rows = query.data?.rows || [];
  const totalCount = Number(query.data?.summary?.movementCount || 0);
  const pageSize = Number(query.data?.pageSize || PAGE_SIZE);
  const hasNext = page * pageSize < totalCount;
  const title = tab === "customer-receipts" ? "مقبوضات الزبائن" : "سدادات الموردين";
  const errorMessage = getErrorMessage(query.error);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({ dateFrom, dateTo, search: search.trim() });
  };

  const changeTab = (nextTab: string) => {
    setTab(nextTab as PaymentTab);
    setPage(1);
    setSelectedPayment(null);
    setSelectedInvoice(null);
  };

  if (selectedInvoice) {
    return (
      <AppShell>
        <InvoiceDetailsView
          type={selectedInvoice.type}
          movementNo={selectedInvoice.movementNo}
          onBack={() => setSelectedInvoice(null)}
        />
      </AppShell>
    );
  }

  if (selectedPayment) {
    return (
      <AppShell>
        <PaymentDetailsView
          selection={selectedPayment}
          onBack={() => setSelectedPayment(null)}
          onOpenInvoice={(movementNo) =>
            setSelectedInvoice({
              type: selectedPayment.tab === "customer-receipts" ? "sales" : "purchase",
              movementNo,
            })
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="المقبوضات والسدادات" subtitle="حركات التحصيل والدفع الحقيقية من قيود المحاسب بدون ربط تخميني بالفواتير." />

      <div className="space-y-4">
        <div className="card-surface space-y-3 p-3">
          <SegmentedTabs
            value={tab}
            onChange={changeTab}
            options={[
              { id: "customer-receipts", label: "مقبوضات الزبائن" },
              { id: "supplier-payments", label: "سدادات الموردين" },
            ]}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
              من تاريخ
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
              />
            </label>
            <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
              إلى تاريخ
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
              />
            </label>
          </div>
          <SearchInput
            placeholder="بحث برقم الحركة أو اسم العميل/المورد أو طريقة الدفع..."
            value={search}
            onChange={setSearch}
          />
          <ActionButton label="بحث" icon={Search} onClick={applyFilters} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-[14px] font-black">{title}</h2>
              <p className="text-[11px] text-muted-foreground">
                <span className="num">{totalCount}</span> حركة مطابقة، الصفحة <span className="num">{page}</span>
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              {tab === "customer-receipts" ? <WalletCards className="size-4" /> : <CreditCard className="size-4" />}
            </span>
          </div>

          {query.isLoading || query.isFetching ? (
            <LoadingState rows={6} />
          ) : query.isError ? (
            <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
          ) : !rows.length ? (
            <EmptyState title="لا توجد حركات" description="لا توجد نتائج مطابقة للفترة أو البحث الحالي." icon={ReceiptText} />
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <PaymentRowCard
                  key={`${tab}-${row.paymentNo}-${row.movementNo || "none"}`}
                  row={row}
                  label={title}
                  onOpen={() => setSelectedPayment({ row, tab })}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <ActionButton
              label="السابق"
              variant="outline"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            />
            <span className="text-[11px] font-bold text-muted-foreground">
              <span className="num">{Math.min(page * pageSize, totalCount)}</span> / <span className="num">{totalCount}</span>
            </span>
            <ActionButton
              label="التالي"
              variant="outline"
              disabled={!hasNext || query.isFetching}
              onClick={() => setPage((current) => current + 1)}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function PaymentRowCard({ row, label, onOpen }: { row: ReportPaymentRow; label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-surface grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3 text-right transition-colors hover:bg-secondary/50 active:scale-[0.99]"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-primary">{label}</span>
          <span className="num text-[11px] font-bold text-muted-foreground">حركة {row.paymentNo}</span>
          {row.movementNo ? <span className="num text-[11px] font-bold text-muted-foreground">مرتبطة بحركة {row.movementNo}</span> : null}
        </div>
        <p className="text-[13px] font-black leading-snug">{row.personName || "حساب غير محدد"}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatDate(row.date)}
          {row.paymentMethod ? ` · ${row.paymentMethod}` : ""}
          {row.notes ? ` · ${row.notes}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span className="text-[13px] font-black">{formatCurrency(Math.abs(Number(row.amount || 0)))}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
          التفاصيل
          <ChevronLeft className="size-3.5" />
        </span>
      </div>
    </button>
  );
}

function PaymentDetailsView({
  selection,
  onBack,
  onOpenInvoice,
}: {
  selection: PaymentSelection;
  onBack: () => void;
  onOpenInvoice: (movementNo: string) => void;
}) {
  const { row, tab } = selection;
  const query = useQuery({
    queryKey: ["payments-center", "movement-details", row.paymentNo],
    queryFn: () => getRevenueMovementDetails(row.paymentNo),
  });
  const movement = query.data?.movement;
  const linkedMovementNo = movement?.invoiceNo ?? row.movementNo ?? null;
  const isCustomer = tab === "customer-receipts";
  const partyId = movement?.customerId;
  const partyRoute = partyId ? (isCustomer ? `/accounts/customers/${partyId}` : `/accounts/suppliers/${partyId}`) : null;
  const realTime = movement?.movementHasRealTime ? formatTime(movement.movementCreatedAt) : null;
  const errorMessage = getErrorMessage(query.error);
  const receiptTitle = isCustomer ? "إيصال قبض" : "إيصال سداد";
  const amount = Math.abs(Number(movement?.amount ?? row.amount ?? 0));
  const partyName = movement?.customerName || row.personName || "-";
  const movementDate = movement?.movementDate || row.date;
  const paymentMethod = movement?.paymentMethod || row.paymentMethod || "-";

  return (
    <div className="receipt-print-area space-y-4 pb-8">
      <div className="no-print sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-1 py-2 backdrop-blur-md">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-bold hover:bg-secondary">
          <ChevronLeft className="size-4 rotate-180" />
          رجوع
        </button>
        <span className="text-[12px] font-black">{isCustomer ? "تفاصيل المقبوض" : "تفاصيل السداد"}</span>
        <button type="button" onClick={() => window.print()} className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary" title="طباعة إيصال">
          <Printer className="size-4" />
        </button>
      </div>

      {query.isLoading ? (
        <LoadingState rows={4} />
      ) : query.isError ? (
        <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className="print-only">
            <PrintHeader title={receiptTitle} subtitle={formatDate(movementDate)} />
            <section className="print-meta-grid">
              <div><span>رقم الحركة</span><strong>{movement?.movementNo || row.paymentNo}</strong></div>
              <div><span>التاريخ</span><strong>{formatDate(movementDate)}</strong></div>
              {realTime ? <div><span>الوقت</span><strong>{realTime}</strong></div> : null}
              <div><span>{isCustomer ? "الزبون" : "المورد"}</span><strong>{partyName}</strong></div>
              <div><span>المبلغ</span><strong>{formatCurrency(amount)}</strong></div>
              <div><span>طريقة الدفع</span><strong>{paymentMethod}</strong></div>
              {linkedMovementNo ? <div><span>الفاتورة المرتبطة</span><strong>{linkedMovementNo}</strong></div> : null}
              {row.notes ? <div><span>ملاحظات</span><strong>{row.notes}</strong></div> : null}
            </section>
            <PrintFooter />
          </div>

          <section className="card-surface space-y-4 p-4">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">رقم حركة الدفع</p>
              <h1 className="num text-xl font-black text-primary">{movement?.movementNo || row.paymentNo}</h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock label={isCustomer ? "الزبون" : "المورد"} value={partyName} />
              <InfoBlock label="المبلغ" value={formatCurrency(amount)} />
              <InfoBlock label="التاريخ" value={formatDate(movementDate)} />
              <InfoBlock label="الوقت" value={realTime || "غير متوفر"} />
              <InfoBlock label="طريقة الدفع" value={paymentMethod} />
              <InfoBlock label="الحساب" value={movement?.accountName || row.personLabel || "-"} />
            </div>

            {row.notes ? (
              <div className="rounded-lg bg-secondary/60 p-3 text-[12px] font-bold text-muted-foreground">
                {row.notes}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <ActionButton label="طباعة إيصال" icon={Printer} onClick={() => window.print()} variant="outline" />
              {linkedMovementNo ? (
                <ActionButton
                  label={isCustomer ? "فتح فاتورة البيع المرتبطة" : "فتح فاتورة الشراء المرتبطة"}
                  icon={FileText}
                  onClick={() => onOpenInvoice(String(linkedMovementNo))}
                />
              ) : (
                <span className="rounded-lg bg-secondary px-3 py-2 text-[12px] font-bold text-muted-foreground">
                  لا توجد فاتورة مرتبطة بعلاقة مؤكدة من قاعدة البيانات.
                </span>
              )}
              {partyRoute ? (
                <Link to={partyRoute} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-[12px] font-bold hover:bg-secondary">
                  فتح الحساب
                </Link>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <div className="mt-1 text-[13px] font-black">{value}</div>
    </div>
  );
}
