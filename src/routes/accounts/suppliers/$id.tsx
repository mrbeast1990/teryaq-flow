import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CreditCard, Printer, ReceiptText, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceList } from "@/components/teryaq/accounts/InvoiceList";
import { PaymentList } from "@/components/teryaq/accounts/PaymentList";
import { type SupplierInvoiceRow, getSupplierInvoices, getSupplierLedger, getSuppliers } from "@/lib/api";

export const Route = createFileRoute("/accounts/suppliers/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل المورد — Teryaq" }],
  }),
  component: SupplierDetailsPage,
});

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatCurrency(value?: number | null) {
  return `${formatNumber(value)} د.ل`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function balanceClass(value?: number | null) {
  const balance = Number(value || 0);
  if (balance > 0) return "text-success";
  if (balance < 0) return "text-destructive";
  return "";
}

type AllocationRow = {
  invoiceNumber: string;
  amount: number;
};

function normalizeAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 1000) / 1000;
}

function unpaidInvoices(rows: SupplierInvoiceRow[]) {
  return rows
    .filter((row) => Number(row.remaining || 0) > 0)
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.date || "").getTime();
      const dateB = new Date(b.date || "").getTime();
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return String(a.invoiceNumber).localeCompare(String(b.invoiceNumber));
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;
      return dateA - dateB || String(a.invoiceNumber).localeCompare(String(b.invoiceNumber));
    });
}

function buildDraftAllocations(invoices: SupplierInvoiceRow[], amount: number): AllocationRow[] {
  let remainingPayment = normalizeAmount(amount);
  return invoices.map((invoice) => {
    const invoiceRemaining = normalizeAmount(Number(invoice.remaining || 0));
    const allocated = Math.min(invoiceRemaining, remainingPayment);
    remainingPayment = normalizeAmount(remainingPayment - allocated);
    return {
      invoiceNumber: String(invoice.invoiceNumber),
      amount: normalizeAmount(allocated),
    };
  });
}

function SupplierDetailsPage() {
  const { id } = useParams({ from: "/accounts/suppliers/$id" });
  const [activeTab, setActiveTab] = useState("statement");
  const [showPaymentDraft, setShowPaymentDraft] = useState(false);

  const suppliersQuery = useQuery({
    queryKey: ["accounts", "suppliers"],
    queryFn: () => getSuppliers(),
  });
  const ledgerQuery = useQuery({
    queryKey: ["accounts", "supplier", id, "ledger", "summary"],
    queryFn: () => getSupplierLedger(id),
  });

  const supplier = suppliersQuery.data?.suppliers?.find((item) => String(item.id) === String(id));
  const balance = supplier?.currentBalance ?? ledgerQuery.data?.rows?.[0]?.runningBalance ?? 0;

  const tabs = [
    { id: "statement", label: "كشف الحساب" },
    { id: "invoices", label: "فواتير الشراء" },
    { id: "payments", label: "السدادات" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 mb-2 bg-background/80 px-1 pb-2 pt-1 backdrop-blur-md">
        <PageHeader title="تفاصيل المورد" subtitle={`معرف: ${id}`} showBack />

        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{supplier?.name || `مورد ${id}`}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{supplier?.phone || "هاتف غير مسجل"}</p>
          </div>
          <div className="shrink-0 text-left">
            <p className="text-[10px] text-muted-foreground">الرصيد الحالي</p>
            <p className={`num text-base font-extrabold ${balanceClass(balance)}`}>{formatNumber(balance)}</p>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <ActionButton
            label={showPaymentDraft ? "إغلاق مسودة السداد" : "تسجيل سداد"}
            icon={WalletCards}
            onClick={() => setShowPaymentDraft((value) => !value)}
          />
        </div>

        <div className="mt-3">
          <SegmentedTabs options={tabs} value={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {showPaymentDraft ? (
          <SupplierPaymentDraft
            supplierId={id}
            supplierName={supplier?.name || `مورد ${id}`}
            currentBalance={balance}
          />
        ) : null}
        {activeTab === "statement" && (
          <div className="space-y-2">
            <div className="no-print flex justify-end">
              <ActionButton label="طباعة كشف الحساب" icon={Printer} onClick={() => window.print()} variant="outline" />
            </div>
            <FinancialStatement
              type="supplier"
              id={id}
              accountName={supplier?.name || `مورد ${id}`}
              accountPhone={supplier?.phone || "هاتف غير مسجل"}
              currentBalance={balance}
            />
          </div>
        )}
        {activeTab === "invoices" && <InvoiceList type="purchase" accountId={id} />}
        {activeTab === "payments" && <PaymentList type="supplier" accountId={id} />}
      </div>
    </AppShell>
  );
}

function SupplierPaymentDraft({
  supplierId,
  supplierName,
  currentBalance,
}: {
  supplierId: string;
  supplierName: string;
  currentBalance: number;
}) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("نقداً");
  const [paymentDate, setPaymentDate] = useState(todayInputValue());
  const [note, setNote] = useState("");
  const [accountingApproval, setAccountingApproval] = useState(false);
  const [allocations, setAllocations] = useState<AllocationRow[]>([]);

  const invoicesQuery = useQuery({
    queryKey: ["accounts", "supplier", supplierId, "payment-draft-invoices"],
    queryFn: () => getSupplierInvoices(supplierId),
  });

  const invoices = useMemo(() => unpaidInvoices(invoicesQuery.data?.rows || []), [invoicesQuery.data?.rows]);
  const paymentAmount = normalizeAmount(Number(amount || 0));
  const totalDebt = normalizeAmount(invoices.reduce((sum, invoice) => sum + Number(invoice.remaining || 0), 0));
  const allocatedTotal = normalizeAmount(allocations.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  const unallocated = normalizeAmount(paymentAmount - allocatedTotal);
  const exceedsDebt = paymentAmount > totalDebt;
  const hasInvoiceOverAllocation = allocations.some((row) => {
    const invoice = invoices.find((item) => String(item.invoiceNumber) === row.invoiceNumber);
    return Number(row.amount || 0) > Number(invoice?.remaining || 0);
  });
  const canPreviewReceipt = paymentAmount > 0 && allocatedTotal > 0 && !hasInvoiceOverAllocation && (!exceedsDebt || accountingApproval);

  useEffect(() => {
    setAllocations(buildDraftAllocations(invoices, paymentAmount));
  }, [invoices, paymentAmount]);

  function updateAllocation(invoiceNumber: string, value: string) {
    const nextAmount = normalizeAmount(Number(value || 0));
    setAllocations((rows) => rows.map((row) => (row.invoiceNumber === invoiceNumber ? { ...row, amount: nextAmount } : row)));
  }

  function printDraftReceipt() {
    window.print();
  }

  return (
    <section className="mb-3 space-y-3 rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-emerald-950">مسودة تسجيل سداد مورد</p>
          <p className="mt-1 text-[11px] leading-5 text-emerald-800">
            هذه الواجهة للمعاينة فقط. الحفظ الحقيقي في المحاسب 3 غير مفعّل حتى تثبيت حقول الكتابة وتوليد المعرفات والتزامن والصلاحيات.
          </p>
        </div>
        <ReceiptText className="mt-1 size-5 shrink-0 text-emerald-700" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-emerald-100">
          <p className="text-[10px] text-muted-foreground">رصيد المورد</p>
          <p className={`num mt-1 text-sm font-black ${balanceClass(currentBalance)}`}>{formatCurrency(currentBalance)}</p>
        </div>
        <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-emerald-100">
          <p className="text-[10px] text-muted-foreground">فواتير غير مسددة</p>
          <p className="num mt-1 text-sm font-black">{invoices.length.toLocaleString("ar-LY")}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-[12px] font-bold">
          <span>مبلغ السداد</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-right num text-sm font-bold outline-none focus:border-primary"
            placeholder="0.000"
          />
        </label>
        <label className="space-y-1 text-[12px] font-bold">
          <span>التاريخ</span>
          <input
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            type="date"
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-right text-sm font-bold outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 text-[12px] font-bold">
          <span>نوع الدفع</span>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1 ring-1 ring-border">
            {["نقداً", "تحويل وحدة"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPaymentType(type)}
                className={`h-9 rounded-md text-[12px] font-extrabold transition-colors ${paymentType === type ? "bg-emerald-600 text-white" : "text-muted-foreground"}`}
              >
                {type === "نقداً" ? "كاش" : "مصرف"}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-[12px] font-bold">
          <span>ملاحظة</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-right text-sm outline-none focus:border-primary"
            placeholder="اختياري"
          />
        </label>
      </div>

      {invoicesQuery.isLoading ? <p className="rounded-lg bg-white p-3 text-[12px] font-bold text-muted-foreground">جاري تحميل فواتير المورد...</p> : null}
      {invoicesQuery.isError ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-[12px] font-bold text-destructive">تعذر تحميل فواتير المورد للمعاينة.</p>
      ) : null}

      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-black">معاينة التوزيع</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              التوزيع التلقائي هنا يبدأ بالفواتير الأقدم كمسودة عمل داخل Flow فقط. لم يتم إثبات ترتيب المحاسب 3 الأصلي بعد.
            </p>
          </div>
          <CreditCard className="size-5 shrink-0 text-primary" />
        </div>

        <div className="mt-3 space-y-2">
          {!invoices.length && !invoicesQuery.isLoading ? (
            <p className="rounded-lg bg-secondary/50 p-3 text-center text-[12px] font-bold text-muted-foreground">لا توجد فواتير شراء غير مسددة لهذا المورد.</p>
          ) : null}
          {invoices.map((invoice) => {
            const allocation = allocations.find((row) => row.invoiceNumber === String(invoice.invoiceNumber));
            const allocated = Number(allocation?.amount || 0);
            const invoiceRemaining = Number(invoice.remaining || 0);
            const invalid = allocated > invoiceRemaining;
            return (
              <article key={String(invoice.invoiceNumber)} className="rounded-lg border border-border bg-secondary/20 p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-black">فاتورة شراء #{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {formatDate(invoice.date)}
                      {invoice.purchaseInvoice ? ` · فاتورة المورد: ${invoice.purchaseInvoice}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="num text-[12px] font-black">{formatCurrency(invoiceRemaining)}</p>
                    <p className="text-[10px] text-muted-foreground">المتبقي</p>
                  </div>
                </div>
                <label className="mt-2 block text-[11px] font-bold">
                  <span>المخصص لهذه الفاتورة</span>
                  <input
                    value={allocated || ""}
                    onChange={(event) => updateAllocation(String(invoice.invoiceNumber), event.target.value)}
                    inputMode="decimal"
                    className={`mt-1 h-9 w-full rounded-lg border bg-white px-3 text-right num text-sm font-bold outline-none ${invalid ? "border-destructive text-destructive" : "border-border focus:border-primary"}`}
                  />
                </label>
                {invalid ? <p className="mt-1 text-[10px] font-bold text-destructive">القيمة المخصصة أكبر من المتبقي لهذه الفاتورة.</p> : null}
              </article>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white p-2 text-center ring-1 ring-border">
          <p className="text-[10px] text-muted-foreground">مبلغ السداد</p>
          <p className="num text-[12px] font-black">{formatCurrency(paymentAmount)}</p>
        </div>
        <div className="rounded-lg bg-white p-2 text-center ring-1 ring-border">
          <p className="text-[10px] text-muted-foreground">الموزع</p>
          <p className="num text-[12px] font-black">{formatCurrency(allocatedTotal)}</p>
        </div>
        <div className="rounded-lg bg-white p-2 text-center ring-1 ring-border">
          <p className="text-[10px] text-muted-foreground">غير موزع</p>
          <p className={`num text-[12px] font-black ${unallocated ? "text-amber-700" : "text-emerald-700"}`}>{formatCurrency(unallocated)}</p>
        </div>
      </div>

      {exceedsDebt ? (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[11px] font-bold text-amber-900 ring-1 ring-amber-200">
          <input type="checkbox" checked={accountingApproval} onChange={(event) => setAccountingApproval(event.target.checked)} className="mt-1" />
          <span>مبلغ السداد أكبر من إجمالي المديونية الظاهرة. يتطلب هذا موافقة محاسبية صريحة قبل تفعيل الحفظ الحقيقي.</span>
        </label>
      ) : null}

      <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-700 ring-1 ring-slate-200">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            لم يتم إنشاء أي قيد في AlmohasebSQL. يلزم قبل التفعيل إثبات توليد `Outstandingvalues_No`، كل الحقول الإلزامية، transaction/idempotency، وصلاحية المستخدم.
          </p>
        </div>
      </div>

      <div className="no-print grid gap-2 sm:grid-cols-2">
        <ActionButton label="طباعة مسودة إيصال" icon={Printer} onClick={printDraftReceipt} variant="outline" disabled={!canPreviewReceipt} />
        <ActionButton label="تأكيد السداد غير مفعّل" icon={ReceiptText} disabled />
      </div>

      <div className="hidden print:block">
        <div className="border-b pb-3 text-center">
          <p className="text-lg font-black">صيدلية الترياق الشافي</p>
          <p className="text-sm font-bold">مسودة إيصال سداد مورد</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p>المورد: {supplierName}</p>
          <p>التاريخ: {paymentDate}</p>
          <p>المبلغ: {formatCurrency(paymentAmount)}</p>
          <p>طريقة الدفع: {paymentType}</p>
          <p className="col-span-2">الملاحظة: {note || "-"}</p>
        </div>
      </div>
    </section>
  );
}
