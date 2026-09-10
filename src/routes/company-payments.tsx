import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  ImageIcon,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { PrintFooter, PrintHeader } from "@/components/teryaq/print/PrintHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import {
  deleteCompanyPayment,
  deleteCompanyPaymentAttachment,
  getCompanies,
  getCompanyPaymentAttachmentUrl,
  getCompanyPayments,
  getCompanyPaymentsExportUrl,
  saveCompany,
  saveCompanyPayment,
  setCompanyPaymentDeducted,
  uploadCompanyPaymentAttachment,
  type Company,
  type CompanyPayment,
  type CompanyPaymentType,
  type PaymentFilters,
} from "@/lib/companyPaymentsApi";

export const Route = createFileRoute("/company-payments")({
  head: () => ({
    meta: [{ title: "سدادات الشركات — Teryaq" }],
  }),
  component: CompanyPaymentsPage,
});

const PAGE_SIZE = 25;

function todayInput() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);
  return `${year}-${String(monthNumber).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
}

function formatCurrency(value: number) {
  return (
    <span className="num whitespace-nowrap" dir="ltr">
      {new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)} د.ل
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ar-LY");
}

function typeLabel(type: CompanyPaymentType) {
  return type === "bank" ? "مصرف" : "كاش";
}

function statusLabel(status: CompanyPayment["status"]) {
  return status === "deducted" ? "مخصوم" : "لم يُخصم";
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-[11px] font-extrabold text-slate-600">
      <span>{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-[13px] text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function CompanyPaymentsPage() {
  const queryClient = useQueryClient();
  const [companySearch, setCompanySearch] = useState("");
  const [companySheetOpen, setCompanySheetOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({ name: "", representativeName: "", phone: "", bankAccount: "" });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CompanyPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    companyId: "",
    amount: "",
    date: todayInput(),
    type: "cash" as CompanyPaymentType,
    notes: "",
    referenceNo: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "month" | "range">("month");
  const [month, setMonth] = useState(monthValue());
  const [dateFrom, setDateFrom] = useState(`${monthValue()}-01`);
  const [dateTo, setDateTo] = useState(monthEnd(monthValue()));
  const [status, setStatus] = useState<PaymentFilters["status"]>("pending");
  const [companyId, setCompanyId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [printPayment, setPrintPayment] = useState<CompanyPayment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["company-payments-companies", companySearch],
    queryFn: () => getCompanies(companySearch),
  });

  const effectiveFilters = useMemo<PaymentFilters>(() => {
    const from = filterMode === "month" ? `${month}-01` : filterMode === "range" ? dateFrom : undefined;
    const to = filterMode === "month" ? monthEnd(month) : filterMode === "range" ? dateTo : undefined;
    return {
      companyId: companyId || undefined,
      status,
      dateFrom: from,
      dateTo: to,
      search: search || undefined,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [companyId, dateFrom, dateTo, filterMode, month, page, search, status]);

  const paymentsQuery = useQuery({
    queryKey: ["company-payments", effectiveFilters],
    queryFn: () => getCompanyPayments(effectiveFilters),
  });

  const companies = companiesQuery.data?.rows || [];
  const payments = paymentsQuery.data?.rows || [];
  const summary = paymentsQuery.data?.summary;
  const totalCount = paymentsQuery.data?.totalCount || 0;
  const canNext = Boolean(paymentsQuery.data?.hasMore);

  const companyStats = useMemo(() => {
    const map = new Map<string, { total: number; pending: number }>();
    payments.forEach((payment) => {
      const current = map.get(payment.companyId) || { total: 0, pending: 0 };
      current.total += payment.amount;
      if (payment.status === "pending") current.pending += payment.amount;
      map.set(payment.companyId, current);
    });
    return map;
  }, [payments]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-payments"] });
    queryClient.invalidateQueries({ queryKey: ["company-payments-companies"] });
  };

  const companyMutation = useMutation({
    mutationFn: saveCompany,
    onSuccess: () => {
      setCompanyForm({ name: "", representativeName: "", phone: "", bankAccount: "" });
      setEditingCompany(null);
      setCompanySheetOpen(false);
      invalidate();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const saved = await saveCompanyPayment({
        id: editingPayment?.id,
        companyId: paymentForm.companyId,
        amount: Number(paymentForm.amount),
        date: paymentForm.date,
        type: paymentForm.type,
        notes: paymentForm.notes,
        referenceNo: paymentForm.referenceNo,
      });
      if (attachmentFile) await uploadCompanyPaymentAttachment(saved.id, attachmentFile);
    },
    onSuccess: () => {
      setPaymentForm({ companyId: "", amount: "", date: todayInput(), type: "cash", notes: "", referenceNo: "" });
      setAttachmentFile(null);
      setEditingPayment(null);
      setShowPaymentForm(false);
      setShowMoreOptions(false);
      invalidate();
    },
  });

  const deleteMutation = useMutation({ mutationFn: deleteCompanyPayment, onSuccess: invalidate });
  const statusMutation = useMutation({
    mutationFn: ({ id, deducted }: { id: string; deducted: boolean }) => setCompanyPaymentDeducted(id, deducted),
    onSuccess: invalidate,
  });
  const attachmentDeleteMutation = useMutation({ mutationFn: deleteCompanyPaymentAttachment, onSuccess: invalidate });

  const submitCompany = (event: FormEvent) => {
    event.preventDefault();
    companyMutation.mutate({ ...companyForm, id: editingCompany?.id });
  };

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    if (!paymentForm.companyId || Number(paymentForm.amount) <= 0) return;
    paymentMutation.mutate();
  };

  const openCompanySheet = (company?: Company) => {
    setEditingCompany(company || null);
    setCompanyForm(company || { name: "", representativeName: "", phone: "", bankAccount: "" });
    setCompanySheetOpen(true);
  };

  const openCompanyDetails = (company: Company) => {
    setSelectedCompany(company);
    setCompanyId(company.id);
    setPage(1);
    setCompaniesOpen(false);
  };

  const beginEditPayment = (payment: CompanyPayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      companyId: payment.companyId,
      amount: String(payment.amount),
      date: payment.date,
      type: payment.type,
      notes: payment.notes,
      referenceNo: payment.referenceNo,
    });
    setAttachmentFile(null);
    setShowMoreOptions(Boolean(payment.notes || payment.referenceNo || payment.attachment));
    setShowPaymentForm(true);
    setOpenMenuId(null);
  };

  const exportUrl = getCompanyPaymentsExportUrl({ ...effectiveFilters, page: undefined, pageSize: undefined });

  return (
    <AppShell>
      <PageHeader
        title="سدادات الشركات"
        subtitle="سجل مستقل لا يغيّر أرصدة أو قيود المحاسب"
        actions={<ActionButton label="سداد جديد" icon={Plus} onClick={() => setShowPaymentForm((value) => !value)} />}
      />

      <div className="-mx-3 -mt-3 min-h-[calc(100vh-7rem)] bg-[#e9fbf6] px-3 pb-4 pt-3 sm:-mx-4 sm:px-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <SummaryCard title="إجمالي السدادات" value={formatCurrency(summary?.totalAmount || 0)} icon={WalletCards} tone="green" />
            <SummaryCard title="لم تُخصم بعد" value={formatCurrency(summary?.pendingAmount || 0)} icon={Banknote} tone="orange" />
          </div>

          <button
            type="button"
            onClick={() => setCompaniesOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl bg-white p-3 text-start shadow-sm ring-1 ring-emerald-100"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-slate-900">الشركات</p>
                <p className="text-[11px] font-semibold text-slate-500">{companiesQuery.data?.totalCount || 0} شركة · بحث وإدارة</p>
              </div>
            </div>
            <ChevronLeft className={`size-5 text-slate-400 transition-transform ${companiesOpen ? "-rotate-90" : ""}`} />
          </button>

          {companiesOpen ? (
            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <SearchInput placeholder="بحث باسم الشركة أو المندوب" value={companySearch} onChange={setCompanySearch} />
                </div>
                <button
                  type="button"
                  onClick={() => openCompanySheet()}
                  className="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm"
                  aria-label="إضافة شركة"
                >
                  <Plus className="size-5" />
                </button>
              </div>
              <div className="space-y-2">
                {companies.length === 0 ? <EmptyState title="لا توجد شركات" description="أضف شركة للبدء بتسجيل السدادات." /> : null}
                {companies.map((company) => {
                  const stats = companyStats.get(company.id);
                  return (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => openCompanyDetails(company)}
                      className="flex w-full items-center justify-between rounded-2xl border border-emerald-50 bg-[#fbfffd] p-3 text-start"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold text-slate-900">{company.name}</p>
                        <p className="truncate text-[11px] font-semibold text-slate-500">{company.representativeName || "بدون مندوب"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-end">
                          <p className="text-[10px] font-bold text-slate-400">ضمن الفلتر</p>
                          <p className="text-[12px] font-extrabold text-emerald-700">{formatCurrency(stats?.total || 0)}</p>
                        </div>
                        <ChevronLeft className="size-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {selectedCompany ? (
            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-emerald-700">تفاصيل الشركة</p>
                  <h2 className="text-[15px] font-extrabold text-slate-900">{selectedCompany.name}</h2>
                  <p className="text-[11px] font-semibold text-slate-500">{[selectedCompany.representativeName, selectedCompany.phone].filter(Boolean).join(" · ") || "بدون بيانات مندوب"}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => openCompanySheet(selectedCompany)} className="rounded-xl border border-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompany(null);
                      setCompanyId("");
                      setPage(1);
                    }}
                    className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-500"
                    aria-label="إغلاق تفاصيل الشركة"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MiniMetric label="إجمالي الشركة" value={formatCurrency(summary?.totalAmount || 0)} tone="green" />
                <MiniMetric label="غير مخصوم" value={formatCurrency(summary?.pendingAmount || 0)} tone="orange" />
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
            <button
              type="button"
              onClick={() => setShowPaymentForm((value) => !value)}
              className="flex w-full items-center justify-between text-start"
            >
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ReceiptText className="size-5" />
                </span>
                <div>
                  <p className="text-[14px] font-extrabold text-slate-900">{editingPayment ? "تعديل سداد" : "إضافة سداد جديد"}</p>
                  <p className="text-[11px] font-semibold text-slate-500">سجل سداد كاش أو مصرف</p>
                </div>
              </div>
              <ChevronLeft className={`size-5 text-slate-400 transition-transform ${showPaymentForm ? "-rotate-90" : ""}`} />
            </button>

            {showPaymentForm ? (
              <form onSubmit={submitPayment} className="mt-3 space-y-3">
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <label className="space-y-1 text-[11px] font-extrabold text-slate-600">
                    <span>الشركة</span>
                    <select
                      required
                      disabled={Boolean(editingPayment)}
                      value={paymentForm.companyId}
                      onChange={(event) => setPaymentForm((form) => ({ ...form, companyId: event.target.value }))}
                      className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-[13px] font-bold text-slate-900 shadow-sm outline-none disabled:opacity-70"
                    >
                      <option value="">اختر الشركة</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => openCompanySheet()}
                    className="mt-5 grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm"
                    aria-label="إضافة شركة"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>

                <Field label="المبلغ" type="number" value={paymentForm.amount} onChange={(amount) => setPaymentForm((form) => ({ ...form, amount }))} required />

                <div className="grid grid-cols-2 gap-2">
                  <Field label="التاريخ" type="date" value={paymentForm.date} onChange={(date) => setPaymentForm((form) => ({ ...form, date }))} required />
                  <div className="space-y-1">
                    <p className="text-[11px] font-extrabold text-slate-600">النوع</p>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-emerald-50 p-1">
                      {(["cash", "bank"] as CompanyPaymentType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPaymentForm((form) => ({ ...form, type }))}
                          className={`h-8 rounded-lg text-[12px] font-extrabold transition ${
                            paymentForm.type === type ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-700"
                          }`}
                        >
                          {typeLabel(type)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMoreOptions((value) => !value)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[12px] font-extrabold text-slate-700"
                >
                  خيارات إضافية
                  <ChevronLeft className={`size-4 transition-transform ${showMoreOptions ? "-rotate-90" : ""}`} />
                </button>

                {showMoreOptions ? (
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
                    <Field label="ملاحظات" value={paymentForm.notes} onChange={(notes) => setPaymentForm((form) => ({ ...form, notes }))} />
                    <Field
                      label="رقم الصك/رقم العملية"
                      value={paymentForm.referenceNo}
                      onChange={(referenceNo) => setPaymentForm((form) => ({ ...form, referenceNo }))}
                    />
                    <label className="block space-y-1 text-[11px] font-extrabold text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Upload className="size-4" /> رفع/تصوير إيصال
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        capture="environment"
                        onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)}
                        className="block w-full rounded-xl border border-dashed border-emerald-200 bg-white p-2 text-[12px]"
                      />
                    </label>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="h-11 w-full rounded-2xl bg-emerald-600 text-[14px] font-extrabold text-white shadow-sm disabled:opacity-60"
                >
                  {editingPayment ? "حفظ التعديل" : "تسجيل السداد"}
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100 print:hidden">
            <div className="mb-3 flex items-center gap-2">
              <Search className="size-4 text-emerald-700" />
              <h2 className="text-[14px] font-extrabold text-slate-900">الفلاتر</h2>
            </div>
            <div className="space-y-2">
              <SearchInput placeholder="بحث في السدادات" value={search} onChange={(value) => { setSearch(value); setPage(1); }} />
              <div className="grid grid-cols-2 gap-2">
                <select value={companyId} onChange={(event) => { setCompanyId(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-emerald-100 bg-white px-3 text-[12px] font-bold">
                  <option value="">كل الشركات</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <select value={status} onChange={(event) => { setStatus(event.target.value as PaymentFilters["status"]); setPage(1); }} className="h-10 rounded-xl border border-emerald-100 bg-white px-3 text-[12px] font-bold">
                  <option value="pending">غير المخصومة فقط</option>
                  <option value="all">الكل</option>
                  <option value="deducted">المخصومة فقط</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-emerald-50 p-1">
                {[
                  ["all", "الكل"],
                  ["month", "شهر محدد"],
                  ["range", "نطاق تاريخ"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFilterMode(id as "all" | "month" | "range");
                      setPage(1);
                    }}
                    className={`h-8 rounded-xl text-[11px] font-extrabold ${filterMode === id ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filterMode === "month" ? (
                <Field label="الشهر" type="month" value={month} onChange={(value) => { setMonth(value); setPage(1); }} />
              ) : null}
              {filterMode === "range" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="من تاريخ" type="date" value={dateFrom} onChange={(value) => { setDateFrom(value); setPage(1); }} />
                  <Field label="إلى تاريخ" type="date" value={dateTo} onChange={(value) => { setDateTo(value); setPage(1); }} />
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={exportUrl} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-100 bg-white px-3 text-[12px] font-extrabold text-emerald-800 shadow-sm">
                <Download className="size-4" /> Excel
              </a>
              <ActionButton label="تقرير PDF/طباعة" icon={Printer} variant="outline" onClick={() => window.print()} />
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-[14px] font-extrabold text-slate-900">قائمة السدادات</h2>
              <p className="text-[11px] font-bold text-slate-500">الأحدث أولًا · {totalCount} نتيجة</p>
            </div>
            {paymentsQuery.isLoading ? <LoadingState rows={5} /> : null}
            {paymentsQuery.isError ? <ErrorState description={(paymentsQuery.error as Error).message} onRetry={() => paymentsQuery.refetch()} /> : null}
            {!paymentsQuery.isLoading && !paymentsQuery.isError && payments.length === 0 ? <EmptyState title="لا توجد سدادات" description="غيّر الفلاتر أو أضف سدادًا جديدًا." /> : null}
            <div className="space-y-2">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  menuOpen={openMenuId === payment.id}
                  onToggleMenu={() => setOpenMenuId((id) => (id === payment.id ? null : payment.id))}
                  onEdit={() => beginEditPayment(payment)}
                  onDelete={() => {
                    if (confirm("هل تريد حذف هذا السداد؟")) deleteMutation.mutate(payment.id);
                  }}
                  onDeduct={() => statusMutation.mutate({ id: payment.id, deducted: payment.status !== "deducted" })}
                  onPrint={() => {
                    setPrintPayment(payment);
                    requestAnimationFrame(() => window.print());
                  }}
                  onDeleteAttachment={() => attachmentDeleteMutation.mutate(payment.id)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 print:hidden">
              <ActionButton label="السابق" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} />
              <span className="text-[12px] font-bold text-slate-500">صفحة {page}</span>
              <ActionButton label="التالي" variant="outline" disabled={!canNext} onClick={() => setPage((value) => value + 1)} />
            </div>
          </section>
        </div>
      </div>

      {companySheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 sm:items-center sm:justify-center print:hidden">
          <form onSubmit={submitCompany} className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700">الشركات</p>
                <h2 className="text-[16px] font-extrabold text-slate-900">{editingCompany ? "تعديل شركة" : "إضافة شركة"}</h2>
              </div>
              <button type="button" onClick={() => setCompanySheetOpen(false)} className="grid size-9 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              <Field label="اسم الشركة" value={companyForm.name || ""} onChange={(name) => setCompanyForm((form) => ({ ...form, name }))} required />
              <Field label="اسم المندوب" value={companyForm.representativeName || ""} onChange={(representativeName) => setCompanyForm((form) => ({ ...form, representativeName }))} />
              <Field label="الهاتف" value={companyForm.phone || ""} onChange={(phone) => setCompanyForm((form) => ({ ...form, phone }))} />
              <Field label="رقم الحساب البنكي" value={companyForm.bankAccount || ""} onChange={(bankAccount) => setCompanyForm((form) => ({ ...form, bankAccount }))} />
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <button type="submit" disabled={companyMutation.isPending} className="h-10 rounded-2xl bg-emerald-600 text-[13px] font-extrabold text-white disabled:opacity-60">
                {editingCompany ? "حفظ التعديل" : "إضافة"}
              </button>
              <button type="button" onClick={() => setCompanySheetOpen(false)} className="h-10 rounded-2xl bg-slate-100 px-4 text-[13px] font-extrabold text-slate-600">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="hidden print:block">
        <PrintHeader
          title={printPayment ? "إيصال سداد" : "تقرير سدادات الشركات"}
          subtitle={`${effectiveFilters.dateFrom || "كل الفترات"} إلى ${effectiveFilters.dateTo || "كل الفترات"}`}
        />
        {printPayment ? <ReceiptPrint payment={printPayment} /> : <ReportPrint rows={payments} />}
        <PrintFooter />
      </div>
    </AppShell>
  );
}

function SummaryCard({ title, value, icon: Icon, tone }: { title: string; value: React.ReactNode; icon: typeof WalletCards; tone: "green" | "orange" }) {
  const toneClass =
    tone === "green"
      ? "from-emerald-500 to-emerald-600 text-white"
      : "from-orange-400 to-amber-500 text-white";
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${toneClass} p-3 shadow-sm`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-2xl bg-white/18">
          <Icon className="size-4" />
        </span>
        <span className="text-[11px] font-extrabold opacity-95">{title}</span>
      </div>
      <div className="text-[17px] font-black">{value}</div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: React.ReactNode; tone: "green" | "orange" }) {
  return (
    <div className={`rounded-2xl p-3 ${tone === "green" ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-800"}`}>
      <p className="text-[10px] font-extrabold opacity-75">{label}</p>
      <p className="text-[14px] font-black">{value}</p>
    </div>
  );
}

function PaymentCard({
  payment,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onDeduct,
  onPrint,
  onDeleteAttachment,
}: {
  payment: CompanyPayment;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeduct: () => void;
  onPrint: () => void;
  onDeleteAttachment: () => void;
}) {
  const attachmentQuery = useQuery({
    queryKey: ["company-payment-attachment-url", payment.id, payment.attachment?.id],
    queryFn: () => getCompanyPaymentAttachmentUrl(payment.id),
    enabled: Boolean(payment.attachment),
  });
  const attachmentUrl = attachmentQuery.data?.url || "";
  const isImage = payment.attachment?.mimeType.startsWith("image/");
  const isDeducted = payment.status === "deducted";

  return (
    <article className="relative rounded-3xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-black text-slate-900">{payment.companyName}</h3>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{formatDate(payment.date)}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-end text-[16px] font-black text-emerald-700">{formatCurrency(payment.amount)}</div>
          <button type="button" onClick={onToggleMenu} className="grid size-8 place-items-center rounded-2xl bg-slate-50 text-slate-500 print:hidden">
            <MoreVertical className="size-4" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="absolute end-3 top-12 z-10 w-36 rounded-2xl border border-slate-100 bg-white p-1 text-[12px] font-bold shadow-lg print:hidden">
          <button type="button" onClick={onEdit} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-slate-700 hover:bg-slate-50">
            <Pencil className="size-4" /> تعديل
          </button>
          <button type="button" onClick={onPrint} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-slate-700 hover:bg-slate-50">
            <Printer className="size-4" /> طباعة
          </button>
          <button type="button" onClick={onDelete} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" /> حذف
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-extrabold text-slate-700">{typeLabel(payment.type)}</span>
        {payment.attachment ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">
            <Paperclip className="size-3" /> مرفق
          </span>
        ) : null}
        <StatusBadge label={statusLabel(payment.status)} tone={isDeducted ? "success" : "neutral"} />
      </div>

      <div className="mt-3 grid gap-2 text-[12px]">
        <InfoLine label="الملاحظات" value={payment.notes || "-"} />
        <InfoLine label="مسجل السداد" value={payment.createdBy || "-"} />
        {payment.deductedBy ? <InfoLine label="قام بالخصم" value={`${payment.deductedBy} · ${formatDateTime(payment.deductedAt)}`} /> : null}
      </div>

      {payment.attachment ? (
        <div className="mt-3 rounded-2xl border border-emerald-50 bg-emerald-50/45 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-extrabold text-slate-700">
              {isImage ? <ImageIcon className="size-4" /> : <FileText className="size-4" />}
              <span className="truncate">{payment.attachment.fileName}</span>
            </span>
            <div className="flex gap-1">
              {attachmentUrl ? (
                <a href={attachmentUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-100 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700">
                  فتح
                </a>
              ) : null}
              <button type="button" onClick={onDeleteAttachment} className="rounded-xl border border-red-100 bg-white px-2 py-1 text-[11px] font-bold text-red-600">
                حذف
              </button>
            </div>
          </div>
          {isImage && attachmentUrl ? <img src={attachmentUrl} alt="معاينة الإيصال" className="mt-2 max-h-32 rounded-2xl border border-emerald-100 object-contain" /> : null}
        </div>
      ) : (
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <Camera className="size-3.5" /> لا يوجد مرفق
        </p>
      )}

      <button
        type="button"
        onClick={onDeduct}
        className={`mt-3 flex h-9 w-full items-center justify-between rounded-2xl px-3 text-[12px] font-extrabold transition print:hidden ${
          isDeducted ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"
        }`}
      >
        <span>{isDeducted ? "مخصوم" : "لم يُخصم"}</span>
        {isDeducted ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
      </button>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
      <span className="shrink-0 text-[11px] font-extrabold text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-end text-[12px] font-bold text-slate-700">{value}</span>
    </div>
  );
}

function ReceiptPrint({ payment }: { payment: CompanyPayment }) {
  return (
    <div className="print-report-body">
      <table className="print-report-table">
        <tbody>
          <tr><th>الشركة</th><td>{payment.companyName}</td></tr>
          <tr><th>المبلغ</th><td>{formatCurrency(payment.amount)}</td></tr>
          <tr><th>التاريخ</th><td>{formatDate(payment.date)}</td></tr>
          <tr><th>النوع</th><td>{typeLabel(payment.type)}</td></tr>
          <tr><th>رقم العملية/الصك</th><td>{payment.referenceNo || "-"}</td></tr>
          <tr><th>الملاحظات</th><td>{payment.notes || "-"}</td></tr>
          <tr><th>مسجل السداد</th><td>{payment.createdBy || "-"}</td></tr>
          <tr><th>حالة الخصم</th><td>{statusLabel(payment.status)}</td></tr>
          <tr><th>تاريخ الخصم</th><td>{payment.deductedAt ? formatDateTime(payment.deductedAt) : "-"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function ReportPrint({ rows }: { rows: CompanyPayment[] }) {
  return (
    <div className="print-report-body">
      <table className="print-report-table">
        <thead>
          <tr>
            <th>الشركة</th>
            <th>المبلغ</th>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>الحالة</th>
            <th>مسجل السداد</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.companyName}</td>
              <td>{formatCurrency(row.amount)}</td>
              <td>{formatDate(row.date)}</td>
              <td>{typeLabel(row.type)}</td>
              <td>{statusLabel(row.status)}</td>
              <td>{row.createdBy || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
