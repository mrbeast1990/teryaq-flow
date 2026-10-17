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
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
type Session = { configured: boolean; authenticated: boolean };

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
  const auth = useQuery({
    queryKey: ["account-administration"],
    queryFn: () => accountRequest<Session>("session"),
    refetchOnWindowFocus: true,
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [code, setCode] = useState("");
  const [edit, setEdit] = useState<{ row: DirectoryAccount; mode: "phone" | "lock" } | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const data = query.data;
  const stateLabel =
    filters.state === "active" ? "النشطة" : filters.state === "closed" ? "المغلقة" : "الكل";
  const scopeLabel = `${noun} — ${stateLabel} — ${filters.balanceFilter === "all" ? "جميع الأرصدة" : filters.balanceFilter === "nonzero" ? "أرصدة غير صفرية" : filters.balanceFilter === "zero" ? "أرصدة صفرية" : customer ? "المدينون فقط" : "المستحق للموردين فقط"}${filters.search ? ` — بحث: ${filters.search}` : ""}${filters.paymentFilter === "none" ? ` — بلا ${customer ? "تحصيل" : "سداد"}` : ""}`;
  function begin(row: DirectoryAccount, mode: "phone" | "lock") {
    setError("");
    setNotice("");
    if (!auth.data?.authenticated) {
      setLoginOpen(true);
      return;
    }
    setPhone(row.phone || "");
    setEdit({ row, mode });
  }
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await accountRequest("login", { code });
      setLoginOpen(false);
      await auth.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الدخول.");
    } finally {
      setCode("");
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!edit || !data) return;
    setBusy(true);
    setError("");
    try {
      await accountRequest("update", {
        kind,
        sourceId: data.sourceId,
        personNo: Number(edit.row.id),
        revision: edit.row.revision,
        ...(edit.mode === "phone" ? { phone } : { closed: !edit.row.closed }),
      });
      setEdit(null);
      setNotice("تم حفظ التعديل.");
      await cache.invalidateQueries({ queryKey: ["account-directory"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ التعديل.");
      await auth.refetch();
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
      const headings = [
        "الاسم",
        "الهاتف",
        "الرصيد",
        "حالة الحساب",
        customer ? "آخر بيع" : "آخر شراء",
        paymentLabel,
      ];
      const values = rows.map((row) => [
        row.name || "",
        row.phone || "",
        String(row.currentBalance ?? 0),
        row.closed ? "مغلق" : "نشط",
        (customer ? row.lastSaleDate : row.lastPurchaseDate) || "",
        (customer ? row.lastCollectionDate : row.lastPaymentDate) || "",
      ]);
      if (popup) {
        popup.document.write(
          `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>${escape(scopeLabel)}</title><style>body{font-family:Cairo,Arial;padding:20px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ddd;padding:6px;text-align:right}</style><h1>صيدلية الترياق الشافي</h1><p>${escape(scopeLabel)}</p><p>العدد: ${rows.length} — مجموع الرصيد: ${number(rows.reduce((sum, row) => sum + Number(row.currentBalance || 0), 0))}</p><table><thead><tr>${headings.map((value) => `<th>${escape(value)}</th>`).join("")}</tr></thead><tbody>${values.map((line) => `<tr>${line.map((value) => `<td>${escape(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></html>`,
        );
        popup.document.close();
        popup.focus();
        popup.print();
      } else {
        const csv = [headings, ...values]
          .map((line) =>
            line
              .map(
                (value) =>
                  `"${(/^[=+@\-]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`,
              )
              .join(","),
          )
          .join("\r\n");
        const url = URL.createObjectURL(
          new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${kind}-${filters.state}.csv`;
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
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">إدارة القفل والهاتف</span>
          <button
            className="flex min-h-9 items-center gap-1 font-bold text-primary"
            onClick={async () => {
              setError("");
              if (auth.data?.authenticated) {
                try {
                  await accountRequest("logout", {});
                  await auth.refetch();
                } catch {
                  setNotice("تعذر إنهاء الجلسة.");
                }
              } else setLoginOpen(true);
            }}
          >
            <LockKeyhole size={14} />
            {auth.data?.authenticated ? "إنهاء جلسة الإدارة" : "فتح الإدارة"}
          </button>
        </div>
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
              <option value="closed">مغلقة</option>
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
                <p>المغلقة ({number(data.closedCount)})</p>
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
                              <span className="rounded bg-muted px-2 text-xs">مغلق</span>
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
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          aria-label={row.closed ? "إعادة فتح الحساب" : "قفل الحساب"}
                          title={row.closed ? "إعادة فتح الحساب" : "قفل الحساب"}
                          className="p-2"
                          onClick={() => begin(row, "lock")}
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
        open={loginOpen}
        onOpenChange={(open) => {
          if (!busy) {
            setLoginOpen(open);
            setCode("");
            setError("");
          }
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg"
        >
          <DialogTitle>إدارة الحسابات</DialogTitle>
          <DialogDescription>جلسة مؤقتة لتعديل القفل والهاتف فقط.</DialogDescription>
          <form onSubmit={login} className="space-y-3">
            <label className="block text-sm">
              رمز الإدارة
              <input
                aria-label="رمز الإدارة"
                type="password"
                autoComplete="off"
                required
                minLength={8}
                maxLength={128}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={field}
              />
            </label>
            {auth.data?.configured === false && (
              <p className="text-sm">رمز الإدارة غير مهيأ. يلزم إعداده محليًا على جهاز الخادم.</p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              className="h-10 w-full rounded-md bg-primary font-bold text-primary-foreground disabled:opacity-50"
              disabled={busy || auth.data?.configured === false}
            >
              {busy ? "جاري التحقق..." : "دخول"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
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
                ? "إعادة فتح الحساب"
                : "تأكيد قفل الحساب"}
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
