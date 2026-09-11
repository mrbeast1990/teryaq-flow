import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, ChevronLeft, Edit3, Plus, Search, X } from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import {
  deleteCompanyPayment,
  getCompanies,
  getCompanyPayments,
  saveCompany,
  setCompanyPaymentDeducted,
  type Company,
  type CompanyPayment,
} from "@/lib/companyPaymentsApi";
import {
  CompanyPaymentCard,
  PAYMENT_OPERATORS,
  formatCompanyPaymentCurrency,
} from "./company-payments";

export const Route = createFileRoute("/company-payments/companies")({
  component: CompanyPaymentsCompaniesPage,
});

const PAGE_SIZE = 25;

function CompanyPaymentsCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companySheetOpen, setCompanySheetOpen] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<Partial<Company>>({ name: "", representativeName: "", phone: "", bankAccount: "" });
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deductPromptPayment, setDeductPromptPayment] = useState<CompanyPayment | null>(null);

  const companiesQuery = useQuery({
    queryKey: ["company-payments-companies-page", search],
    queryFn: () => getCompanies(search),
  });

  const paymentsQuery = useQuery({
    queryKey: ["company-payments-company-details", selectedCompany?.id, page],
    queryFn: () => getCompanyPayments({ companyId: selectedCompany?.id, status: "all", page, pageSize: PAGE_SIZE }),
    enabled: Boolean(selectedCompany?.id),
  });

  const companyMutation = useMutation({
    mutationFn: saveCompany,
    onMutate: () => setCompanyError(null),
    onSuccess: (company) => {
      setCompanySheetOpen(false);
      setCompanyForm({ name: "", representativeName: "", phone: "", bankAccount: "" });
      if (selectedCompany?.id === company.id) setSelectedCompany(company);
      queryClient.invalidateQueries({ queryKey: ["company-payments-companies-page"] });
      queryClient.invalidateQueries({ queryKey: ["company-payments-companies"] });
    },
    onError: (error) => setCompanyError(error instanceof Error ? error.message : "تعذر حفظ الشركة."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-payments-company-details"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, deducted, deductedBy }: { id: string; deducted: boolean; deductedBy?: string }) =>
      setCompanyPaymentDeducted(id, deducted, deductedBy),
    onSuccess: () => {
      setDeductPromptPayment(null);
      queryClient.invalidateQueries({ queryKey: ["company-payments-company-details"] });
    },
  });

  const companies = useMemo(() => companiesQuery.data?.rows || [], [companiesQuery.data]);
  const payments = paymentsQuery.data?.rows || [];
  const summary = paymentsQuery.data?.summary;

  const openCompanySheet = (company?: Company) => {
    setCompanyError(null);
    setCompanyForm(company || { name: "", representativeName: "", phone: "", bankAccount: "" });
    setCompanySheetOpen(true);
  };

  const submitCompany = (event: FormEvent) => {
    event.preventDefault();
    const name = String(companyForm.name || "").trim();
    if (!name) {
      setCompanyError("اسم الشركة إلزامي.");
      return;
    }
    companyMutation.mutate({ ...companyForm, name });
  };

  return (
    <AppShell>
      <PageHeader
        title="الشركات"
        subtitle="إدارة شركات سدادات الشركات دون أي ربط مع المحاسب"
        showBack
        actions={<ActionButton label="إضافة شركة" icon={Plus} onClick={() => openCompanySheet()} />}
      />

      <div className="-mx-3 -mt-3 min-h-[calc(100vh-7rem)] bg-[#e9fbf6] px-3 pb-4 pt-3 sm:-mx-4 sm:px-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <Link to="/company-payments" className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-[12px] font-extrabold text-emerald-800 shadow-sm ring-1 ring-emerald-100">
            <ArrowRight className="size-4" />
            رجوع إلى السدادات
          </Link>

          {!selectedCompany ? (
            <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[12px] font-extrabold text-slate-900">قائمة الشركات</p>
                  <p className="text-[11px] font-bold text-slate-500">{companiesQuery.data?.totalCount || 0} شركة</p>
                </div>
                <Search className="size-4 text-emerald-700" />
              </div>
              <SearchInput placeholder="بحث باسم الشركة أو المندوب" value={search} onChange={setSearch} />
              <div className="mt-3 space-y-2">
                {companiesQuery.isLoading ? <LoadingState rows={5} /> : null}
                {companiesQuery.isError ? <ErrorState description={(companiesQuery.error as Error).message} onRetry={() => companiesQuery.refetch()} /> : null}
                {!companiesQuery.isLoading && companies.length === 0 ? <EmptyState title="لا توجد شركات" description="غيّر البحث أو أضف شركة جديدة." /> : null}
                {companies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompany(company);
                      setPage(1);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-emerald-50 bg-[#fbfffd] p-2.5 text-start"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Building2 className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold text-slate-900">{company.name}</p>
                        <p className="truncate text-[11px] font-semibold text-slate-500">{company.representativeName || "بدون مندوب"}</p>
                      </div>
                    </div>
                    <ChevronLeft className="size-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-emerald-700">تفاصيل الشركة</p>
                    <h2 className="truncate text-[16px] font-extrabold text-slate-900">{selectedCompany.name}</h2>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">
                      {[selectedCompany.representativeName, selectedCompany.phone, selectedCompany.bankAccount].filter(Boolean).join(" · ") || "بدون بيانات إضافية"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => openCompanySheet(selectedCompany)} className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Edit3 className="size-4" />
                    </button>
                    <button type="button" onClick={() => setSelectedCompany(null)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-500">
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">
                    <p className="text-[10px] font-extrabold opacity-75">إجمالي السدادات</p>
                    <p className="text-[14px] font-black">{formatCompanyPaymentCurrency(summary?.totalAmount || 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-3 text-orange-800">
                    <p className="text-[10px] font-extrabold opacity-75">غير مخصوم</p>
                    <p className="text-[14px] font-black">{formatCompanyPaymentCurrency(summary?.pendingAmount || 0)}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[14px] font-extrabold text-slate-900">سدادات الشركة</h2>
                  <p className="text-[11px] font-bold text-slate-500">{paymentsQuery.data?.totalCount || 0} نتيجة</p>
                </div>
                {paymentsQuery.isLoading ? <LoadingState rows={5} /> : null}
                {paymentsQuery.isError ? <ErrorState description={(paymentsQuery.error as Error).message} onRetry={() => paymentsQuery.refetch()} /> : null}
                {!paymentsQuery.isLoading && payments.length === 0 ? <EmptyState title="لا توجد سدادات" description="لا توجد سدادات مسجلة لهذه الشركة ضمن البيانات الحالية." /> : null}
                {payments.map((payment) => (
                  <CompanyPaymentCard
                    key={payment.id}
                    payment={payment}
                    menuOpen={openMenuId === payment.id}
                    onToggleMenu={() => setOpenMenuId((id) => (id === payment.id ? null : payment.id))}
                    onDelete={() => {
                      if (confirm("هل تريد حذف هذا السداد؟")) deleteMutation.mutate(payment.id);
                    }}
                    onDeduct={() => {
                      if (payment.status === "deducted") statusMutation.mutate({ id: payment.id, deducted: false });
                      else setDeductPromptPayment(payment);
                    }}
                    onPrint={() => window.print()}
                  />
                ))}
                <div className="flex items-center justify-between gap-2 print:hidden">
                  <ActionButton label="السابق" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} />
                  <span className="text-[12px] font-bold text-slate-500">صفحة {page}</span>
                  <ActionButton label="التالي" variant="outline" disabled={!paymentsQuery.data?.hasMore} onClick={() => setPage((value) => value + 1)} />
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {companySheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 sm:items-center sm:justify-center print:hidden">
          <form noValidate onSubmit={submitCompany} className="w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700">الشركات</p>
                <h2 className="text-[16px] font-extrabold text-slate-900">{companyForm.id ? "تعديل شركة" : "إضافة شركة"}</h2>
              </div>
              <button type="button" onClick={() => setCompanySheetOpen(false)} className="grid size-9 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2">
              <SheetField label="اسم الشركة" value={companyForm.name || ""} onChange={(name) => setCompanyForm((form) => ({ ...form, name }))} required />
              <SheetField label="اسم المندوب" value={companyForm.representativeName || ""} onChange={(representativeName) => setCompanyForm((form) => ({ ...form, representativeName }))} />
              <SheetField label="الهاتف" value={companyForm.phone || ""} onChange={(phone) => setCompanyForm((form) => ({ ...form, phone }))} />
              <SheetField label="رقم الحساب البنكي" value={companyForm.bankAccount || ""} onChange={(bankAccount) => setCompanyForm((form) => ({ ...form, bankAccount }))} />
            </div>
            {companyError ? <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">{companyError}</p> : null}
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <button type="submit" disabled={companyMutation.isPending} className="h-10 rounded-2xl bg-emerald-600 text-[13px] font-extrabold text-white disabled:opacity-60">
                {companyForm.id ? "حفظ التعديل" : "إضافة"}
              </button>
              <button type="button" onClick={() => setCompanySheetOpen(false)} className="h-10 rounded-2xl bg-slate-100 px-4 text-[13px] font-extrabold text-slate-600">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deductPromptPayment ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 px-3 pb-3 sm:items-center sm:justify-center print:hidden">
          <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-emerald-700">تأكيد الخصم</p>
                <h2 className="text-[16px] font-extrabold text-slate-900">تم الخصم بواسطة</h2>
                <p className="mt-1 text-[12px] font-semibold text-slate-500">{deductPromptPayment.companyName}</p>
              </div>
              <button type="button" onClick={() => setDeductPromptPayment(null)} className="grid size-9 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPERATORS.map((operator) => (
                <button
                  key={operator}
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: deductPromptPayment.id, deducted: true, deductedBy: operator })}
                  className="h-11 rounded-2xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm disabled:opacity-60"
                >
                  {operator}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function SheetField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-[11px] font-extrabold text-slate-600">
      <span>{label}</span>
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-emerald-100 bg-white px-3 text-[13px] text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
