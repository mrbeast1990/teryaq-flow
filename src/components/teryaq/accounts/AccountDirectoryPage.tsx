import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  FileDown,
  LockKeyhole,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  RefreshCw,
  UnlockKeyhole,
} from "lucide-react";
import { AppShell } from "../AppShell";
import { PageHeader } from "../PageHeader";
import { ActionButton } from "../ActionButton";
import { SearchInput } from "../SearchInput";
import { EmptyState, ErrorState, LoadingState } from "../States";
import { AccountActivity } from "./AccountActivity";
import { accountExcelBlob } from "@/lib/accountExcelExport";
import { accountReportPrintHtml } from "@/lib/accountReportPrint";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  accountRequest,
  allFilteredAccounts,
  listAccounts,
  type DirectoryAccount,
} from "@/lib/accountDirectoryApi";
import {
  libyaWhatsappNumber,
  usablePhone,
  type AccountDirectoryFilters,
  type AccountKind,
} from "@/lib/accountDirectory";

const number = (value: number) =>
  new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 3 }).format(value);
const field = "h-10 w-full min-w-0 rounded-md border border-border bg-card px-2 text-sm";

export function AccountDirectoryPage({ kind }: { kind: AccountKind }) {
  const customer = kind === "customer";
  const noun = customer ? "الزبائن" : "الموردون";
  const paymentLabel = customer ? "آخر تحصيل" : "آخر سداد";
  const cache = useQueryClient();
  const [filters, setFilters] = useState<AccountDirectoryFilters>({
    kind,
    state: "active",
    balanceFilter: "nonzero",
    search: "",
    page: 1,
    pageSize: 50,
    primarySort: "balance",
    secondarySort: "none",
    balanceDirection: customer ? "desc" : "asc",
    paymentDirection: "desc",
    paymentFilter: "all",
  });
  const change = (patch: Partial<AccountDirectoryFilters>) =>
    setFilters((old) => ({ ...old, ...patch, page: 1 }));
  const query = useQuery({
    queryKey: ["account-directory", filters],
    queryFn: () => listAccounts(filters),
    retry: 1,
  });
  const [edit, setEdit] = useState<{ row: DirectoryAccount; mode: "phone" | "lock" } | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const data = query.data;
  const stateLabel =
    filters.state === "active" ? "النشطة" : filters.state === "closed" ? "المعطّلة" : "الكل";
  const scopeLabel = `${noun} — ${stateLabel} — ${filters.balanceFilter === "all" ? "جميع الأرصدة" : filters.balanceFilter === "nonzero" ? "أرصدة غير صفرية" : filters.balanceFilter === "zero" ? "أرصدة صفرية" : customer ? "المدينون فقط" : "المستحق للموردين فقط"}${filters.search ? ` — بحث: ${filters.search}` : ""}${filters.paymentFilter === "none" ? ` — بلا ${customer ? "تحصيل" : "سداد"}` : ""}`;
  function begin(row: DirectoryAccount, mode: "phone" | "lock") {
    setError("");
    setNotice("");
    if (mode === "lock" && row.closed) {
      void persist(row, { closed: false });
      return;
    }
    setPhone(row.phone || "");
    setEdit({ row, mode });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!edit) return;
    await persist(edit.row, edit.mode === "phone" ? { phone } : { closed: true });
  }
  async function persist(row: DirectoryAccount, changes: { closed?: boolean; phone?: string }) {
    if (!data || busy) return;
    setBusy(true);
    setError("");
    try {
      await accountRequest("update", {
        kind,
        sourceId: data.sourceId,
        personNo: Number(row.id),
        revision: row.revision,
        ...changes,
      });
      setEdit(null);
      setNotice("تم حفظ التعديل.");
      await cache.invalidateQueries({ queryKey: ["account-directory"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر حفظ التعديل.";
      setError(message);
      setNotice(message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("تم نسخ الرقم.");
    } catch {
      setNotice("تعذر النسخ. يمكنك نسخ الرقم يدويًا.");
    }
  }
  async function output(print: boolean) {
    const popup = print ? window.open("", "_blank", "width=900,height=700") : null;
    if (print && !popup) {
      setNotice("تعذر فتح نافذة الطباعة.");
      return;
    }
    if (popup) popup.document.body.textContent = "جاري تجهيز التقرير...";
    setBusy(true);
    setNotice("");
    try {
      const rows = await allFilteredAccounts(filters);
      if (popup) {
        popup.document.write(accountReportPrintHtml(rows, kind, scopeLabel));
        popup.document.close();
        popup.focus();
        popup.print();
      } else {
        const url = URL.createObjectURL(await accountExcelBlob(rows, kind));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${kind}-${filters.state}.xlsx`;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      popup?.close();
      setNotice(err instanceof Error ? err.message : "تعذر تجهيز التقرير.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell>
      <PageHeader
        title={noun}
        showBack
        actions={
          <div className="flex gap-1">
            <ActionButton
              label="طباعة"
              icon={Printer}
              onClick={() => output(true)}
              disabled={busy || !data}
              variant="outline"
            />
            <ActionButton
              label="تصدير"
              icon={FileDown}
              onClick={() => output(false)}
              disabled={busy || !data}
              variant="outline"
            />
            <ActionButton
              label="تحديث"
              icon={RefreshCw}
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              variant="outline"
            />
          </div>
        }
      />
      <div className="my-3 space-y-2">
        <SearchInput
          placeholder="الاسم، الهاتف، أو رقم الحساب..."
          value={filters.search}
          onChange={(search) => change({ search })}
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs font-bold">
            حالة الحساب
            <select
              aria-label="حالة الحساب"
              className={field}
              value={filters.state}
              onChange={(e) =>
                change({ state: e.target.value as AccountDirectoryFilters["state"] })
              }
            >
              <option value="active">نشطة</option>
              <option value="closed">معطّلة</option>
              <option value="all">الكل</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold">
            حالة الرصيد
            <select
              aria-label="حالة الرصيد"
              className={field}
              value={filters.balanceFilter}
              onChange={(e) => change({ balanceFilter: e.target.value })}
            >
              <option value="nonzero">غير صفري</option>
              <option value="all">الجميع</option>
              <option value={customer ? "debtors" : "creditors"}>
                {customer ? "المدينون فقط" : "المستحق للموردين"}
              </option>
              <option value="zero">رصيد صفري</option>
            </select>
          </label>
        </div>
        <details className="border-y border-border py-2">
          <summary className="cursor-pointer text-sm font-bold">
            الترتيب وفلتر {customer ? "التحصيل" : "السداد"}
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <label>
              الترتيب الأساسي
              <select
                aria-label="الترتيب الأساسي"
                className={field}
                value={filters.primarySort}
                onChange={(e) =>
                  change({
                    primarySort: e.target.value as "balance" | "payment",
                    secondarySort: "none",
                  })
                }
              >
                <option value="balance">الرصيد</option>
                <option value="payment">{paymentLabel}</option>
              </select>
            </label>
            <label>
              كسر التعادل
              <select
                aria-label="كسر التعادل"
                className={field}
                value={filters.secondarySort}
                onChange={(e) =>
                  change({
                    secondarySort: e.target.value as AccountDirectoryFilters["secondarySort"],
                  })
                }
              >
                <option value="none">بدون</option>
                <option value={filters.primarySort === "balance" ? "payment" : "balance"}>
                  {filters.primarySort === "balance" ? paymentLabel : "الرصيد"}
                </option>
              </select>
            </label>
            <label>
              ترتيب الرصيد
              <select
                aria-label="ترتيب الرصيد"
                className={field}
                value={filters.balanceDirection}
                onChange={(e) => change({ balanceDirection: e.target.value as "asc" | "desc" })}
              >
                <option value="desc">الأعلى قيمة</option>
                <option value="asc">الأقل قيمة</option>
              </select>
            </label>
            <label>
              ترتيب {paymentLabel}
              <select
                aria-label="ترتيب تاريخ السداد"
                className={field}
                value={filters.paymentDirection}
                onChange={(e) => change({ paymentDirection: e.target.value as "asc" | "desc" })}
              >
                <option value="desc">الأحدث</option>
                <option value="asc">الأقدم</option>
              </select>
            </label>
            <label className="col-span-2 flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                checked={filters.paymentFilter === "none"}
                onChange={(e) => change({ paymentFilter: e.target.checked ? "none" : "all" })}
              />
              بلا {customer ? "تحصيل" : "سداد"} فقط
            </label>
          </div>
        </details>
      </div>
      {notice && (
        <p role="status" className="my-2 rounded-md bg-muted p-2 text-sm">
          {notice}
        </p>
      )}
      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState description={query.error.message} onRetry={() => query.refetch()} />
      ) : (
        data && (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              الإجماليات ضمن البحث وحالة الرصيد وفلتر {customer ? "التحصيل" : "السداد"} الحالية، من
              كامل النتائج.
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-card p-2">
                <p>النشطة ({number(data.activeCount)})</p>
                <strong className="text-base">{number(data.activeBalance)} د.ل</strong>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p>المعطّلة ({number(data.closedCount)})</p>
                <strong className="text-base">{number(data.closedBalance)} د.ل</strong>
              </div>
            </div>
            <p className="mb-2 text-xs">
              النتائج المعروضة: {stateLabel} — {number(data.totalCount)} حساب — مجموع الرصيد:{" "}
              {number(data.totalBalance)} د.ل
            </p>
            {!data.rows.length ? (
              <EmptyState title="لا توجد حسابات مطابقة" description="غيّر البحث أو الفلاتر." />
            ) : (
              <div className="space-y-2">
                {data.rows.map((row) => {
                  const whatsapp = libyaWhatsappNumber(row.phone || "");
                  return (
                    <article
                      key={row.id}
                      data-account-id={row.id}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <Link
                        to={customer ? "/accounts/customers/$id" : "/accounts/suppliers/$id"}
                        params={{ id: String(row.id) }}
                        className={`block p-3 ${row.closed ? "opacity-55" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h2 className="break-words text-sm font-bold leading-6">
                              {row.name || "غير محدد"}
                            </h2>
                            {row.closed && (
                              <span className="rounded bg-muted px-2 text-xs">معطّل</span>
                            )}
                          </div>
                          <div className="shrink-0 text-end">
                            <strong
                              className={`text-sm ${Number(row.currentBalance) > 0 ? "text-emerald-700" : Number(row.currentBalance) < 0 ? "text-red-700" : "text-muted-foreground"}`}
                            >
                              {number(Number(row.currentBalance || 0))}
                            </strong>
                            <p className="text-[11px] text-muted-foreground">الرصيد · د.ل</p>
                          </div>
                        </div>
                        <div className="mt-1">
                          <AccountActivity account={row} type={kind} />
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-1 border-t border-border px-2 py-1 text-xs">
                        <span className="min-w-0 flex-1 break-all" dir="ltr">
                          {row.phone || "هاتف غير مسجل"}
                        </span>
                        {usablePhone(row.phone) && (
                          <>
                            <a
                              aria-label="اتصال"
                              title="اتصال"
                              className="p-2"
                              href={`tel:${row.phone}`}
                            >
                              <Phone size={16} />
                            </a>
                            {whatsapp && (
                              <a
                                aria-label="واتساب"
                                title="واتساب"
                                className="p-2 text-green-700"
                                target="_blank"
                                rel="noopener noreferrer"
                                href={`https://wa.me/${whatsapp}`}
                              >
                                <MessageCircle size={16} />
                              </a>
                            )}
                            <button
                              aria-label="نسخ الهاتف"
                              title="نسخ الهاتف"
                              className="p-2"
                              onClick={() => copy(row.phone!)}
                            >
                              <Copy size={16} />
                            </button>
                          </>
                        )}
                        <button
                          aria-label="تعديل الهاتف"
                          title="تعديل الهاتف"
                          className="p-2"
                          onClick={() => begin(row, "phone")}
                          disabled={busy}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={row.closed ? "إعادة تفعيل الحساب" : "تعطيل الحساب"}
                          title={row.closed ? "إعادة تفعيل الحساب" : "تعطيل الحساب"}
                          className="p-2"
                          onClick={() => begin(row, "lock")}
                          disabled={busy}
                        >
                          {row.closed ? <UnlockKeyhole size={16} /> : <LockKeyhole size={16} />}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <div className="my-3 grid grid-cols-2 gap-2">
              <ActionButton
                label="السابق"
                variant="outline"
                disabled={filters.page <= 1 || query.isFetching}
                onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}
              />
              <ActionButton
                label="التالي"
                variant="outline"
                disabled={!data.hasMore || query.isFetching}
                onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">صفحة {filters.page}</p>
          </>
        )
      )}
      <Dialog
        open={Boolean(edit)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setEdit(null);
            setError("");
          }
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg"
        >
          <DialogTitle>
            {edit?.mode === "phone"
              ? "تعديل الهاتف"
              : edit?.row.closed
                ? "إعادة تفعيل الحساب"
                : "تأكيد تعطيل الحساب"}
          </DialogTitle>
          <DialogDescription>{edit?.row.name}</DialogDescription>
          <form onSubmit={save} className="space-y-3">
            {edit?.mode === "phone" ? (
              <label className="block text-sm">
                رقم الهاتف
                <input
                  aria-label="رقم الهاتف"
                  type="tel"
                  dir="ltr"
                  required
                  maxLength={80}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={field}
                />
              </label>
            ) : (
              <p className="text-sm">
                {edit?.row.closed
                  ? "سيعود الحساب إلى قائمة الحسابات النشطة."
                  : "سيُستبعد الحساب من إجماليات النشطة، ويبقى رصيده وسجله المحاسبي وتفاصيله دون تغيير."}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              className="h-10 w-full rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-50"
              disabled={busy || (edit?.mode === "phone" && !phone.trim())}
            >
              {busy ? "جاري الحفظ..." : "تأكيد وحفظ"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
