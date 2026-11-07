import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { downloadSettlementReceipt, SettlementApiError, settlementRequest, settlementUnits, settlementMoney, type CashSettlementRequest, type CashSettlementReceipt, type SettlementHistory, type SettlementInvoice, type SettlementMode } from "@/lib/supplierSettlementsApi";
import { getApiBaseUrl } from "@/lib/api/config";

const inputClass = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary";
type Session = { authenticated: boolean; csrf: string | null };

export function SupplierSettlementSandbox({ supplierId, mode = "sandbox", onPosted }: { supplierId: string; mode?: SettlementMode; onPosted?: () => void }) {
  const production = mode === "production";
  const scopeLabel = production ? "الإنتاج" : "قاعدة الاختبار";
  const [session, setSession] = useState<Session | null>(null);
  const [secret, setSecret] = useState("");
  const [invoices, setInvoices] = useState<SettlementInvoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [netRemaining, setNetRemaining] = useState<string | null>(null);
  const [names, setNames] = useState({ userName: "", cashBookName: "" });
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [amount, setAmount] = useState("");
  const [firstMovement, setFirstMovement] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tripoli", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const [note, setNote] = useState("سداد Flow");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<CashSettlementReceipt | null>(null);
  const [history, setHistory] = useState<SettlementHistory | null>(null);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [methodError, setMethodError] = useState("");
  const pending = useRef<CashSettlementRequest | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const storageKey = `supplier-settlement-request:${getApiBaseUrl()}:${mode}:${supplierId}`;
  const [uncertain, setUncertain] = useState(false);
  const selected = invoices.filter(r => (settlementUnits(amounts[r.movementNo] || "") || 0n) > 0n);
  const total = selected.reduce((sum, r) => sum + (settlementUnits(amounts[r.movementNo] || "") || 0n), 0n);
  const netDebt = settlementUnits(netRemaining || "") || 0n;
  const valid = total > 0n && total <= netDebt && total === settlementUnits(amount) && selected.some(r => r.movementNo === firstMovement) && selected.every(r => {
    const allocated = settlementUnits(amounts[r.movementNo] || "");
    const remaining = settlementUnits(r.remaining);
    return allocated !== null && remaining !== null && allocated <= remaining;
  }) && !Object.values(amounts).some(v => v !== "" && settlementUnits(v) === null);

  async function loadInvoices() {
    setInvoicesLoaded(false);
    const data = await settlementRequest<{ mode: SettlementMode; netRemaining: string; rows: SettlementInvoice[]; userName: string; cashBookName: string }>(`/suppliers/${supplierId}/invoices`);
    if (data.mode !== mode) throw new Error("تغيرت بيئة السداد؛ أغلق النموذج وأعد فتحه قبل المتابعة.");
    setInvoices(data.rows.filter(r => !r.closeInvoice && !r.caseInvoice && !r.invalidUnits && !r.invalidLinks && (settlementUnits(r.remaining) || 0n) > 0n));
    setNetRemaining(data.netRemaining);
    setNames({ userName: data.userName, cashBookName: data.cashBookName });
    setInvoicesLoaded(true);
  }

  async function loadHistory(page = 1) {
    setHistoryBusy(true); setHistoryError("");
    try { setHistory(await settlementRequest<SettlementHistory>(`/suppliers/${supplierId}/payments?page=${page}&pageSize=10`)); }
    catch (e) { setHistoryError(e instanceof Error ? e.message : "تعذر تحميل سجل الإيصالات."); }
    finally { setHistoryBusy(false); }
  }

  useEffect(() => {
    let active = true;
    try {
      const previousId = sessionStorage.getItem(storageKey);
      if (previousId) { setPendingId(previousId); setUncertain(true); }
    } catch { /* Saving fails closed if browser storage cannot retain the request ID. */ }
    settlementRequest<Session>("/session").then(s => { if (active) setSession(s); }).catch(e => { if (active) { setError(e.message); setSession({ authenticated: false, csrf: null }); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.authenticated) return;
    void loadHistory();
    setMethodError("");
    settlementRequest<{ methods: { id: string; label: string }[] }>("/payment-methods")
      .then(data => {
        const method = data.methods.find(method => method.id === "cash");
        if (!method) throw new Error("لا توجد طريقة سداد نقدي معتمدة.");
        setPaymentMethod(method.label);
      })
      .catch(() => { setPaymentMethod(null); setMethodError("تعذر التحقق من طريقة السداد؛ الحفظ معطّل مؤقتًا. أغلق النموذج وأعد فتحه."); });
    setBusy(true);
    (async () => { await loadInvoices(); if (pendingId && !pending.current) await recoverReceipt(pendingId); })()
      .catch(e => { setError(e.message); if (e instanceof SettlementApiError && e.status === 401) setSession({ authenticated: false, csrf: null }); }).finally(() => setBusy(false));
  }, [session?.authenticated, supplierId]);

  function clearPending() {
    try { sessionStorage.removeItem(storageKey); } catch { /* An existing ID can still be recovered safely after reopening. */ }
    pending.current = null; setPendingId(null); setUncertain(false);
  }

  async function recoverReceipt(id: string) {
    const result = await settlementRequest<{ receipt: CashSettlementReceipt }>(`/payments/${id}`);
    if (result.receipt.mode !== mode || result.receipt.supplierId !== Number(supplierId)) throw new Error("إيصال السداد لا يطابق البيئة أو المورد الحالي.");
    if (result.receipt.allocations.length && result.receipt.requestId === id) { setReceipt(result.receipt); clearPending(); onPosted?.(); }
  }

  async function login(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { setSession(await settlementRequest<Session>("/login", { secret })); }
    catch (e) { setError(e instanceof Error ? e.message : "تعذر تسجيل الدخول."); }
    finally { setSecret(""); setBusy(false); }
  }

  async function save() {
    if (pendingId && !pending.current && session?.csrf) {
      setBusy(true); setError("");
      try { await recoverReceipt(pendingId); await loadInvoices(); }
      catch (e) { setError(e instanceof Error ? e.message : "لم تتأكد نتيجة الطلب."); if (e instanceof SettlementApiError && e.status === 401) setSession({ authenticated: false, csrf: null }); }
      finally { setBusy(false); }
      return;
    }
    if (!session?.csrf || (!valid && !pending.current)) return;
    if (!pending.current && !window.confirm(production
      ? `تأكيد تسجيل سداد نقدي فعلي بقيمة ${settlementMoney(total)} د.ل على ${selected.length} فاتورة؟ لا يمكن تعديل السداد أو حذفه أو إلغاؤه حاليًا.`
      : "تأكيد سداد نقدي في قاعدة الاختبار فقط؟")) return;
    if (!pending.current) pending.current = { requestId: crypto.randomUUID(), supplierId: Number(supplierId), amount: settlementMoney(total), date, note, paymentType: "cash", allocations: selected.slice().sort((a, b) => Number(b.movementNo === firstMovement) - Number(a.movementNo === firstMovement)).map(r => ({ movementNo: r.movementNo, amount: settlementMoney(settlementUnits(amounts[r.movementNo] || "")!) })) };
    try { sessionStorage.setItem(storageKey, pending.current.requestId); setPendingId(pending.current.requestId); }
    catch { pending.current = null; setError("تعذر حفظ معرف إعادة المحاولة في المتصفح؛ لم يُرسل السداد."); return; }
    setBusy(true); setError("");
    try {
      const result = await settlementRequest<{ receipt: CashSettlementReceipt }>("/payments", pending.current, session.csrf);
      setReceipt(result.receipt); clearPending(); setAmounts({}); setAmount(""); setFirstMovement(null);
      onPosted?.(); void loadHistory();
      void loadInvoices().catch(() => setError("تم تسجيل السداد. تعذر تحديث الفواتير؛ أعد تحميلها دون تكرار السداد."));
    } catch (e) {
      const rejected = e instanceof SettlementApiError && (e.status === 400 || ["INVOICE_CHANGED", "DEBT_CHANGED", "OPERATOR_MAPPING", "UNSUPPORTED_LEDGER"].includes(e.code));
      if (rejected) clearPending();
      if (e instanceof SettlementApiError && e.status === 401) setSession({ authenticated: false, csrf: null });
      setUncertain(!rejected && pending.current !== null);
      setError(e instanceof Error ? e.message : "لم تتأكد النتيجة. أعد المحاولة بنفس الطلب.");
    }
    finally { setBusy(false); }
  }

  async function openReceipt(id: string) {
    setExportBusy(true); setExportError("");
    try {
      const data = await settlementRequest<{ receipt: CashSettlementReceipt }>(`/payments/${id}`);
      if (data.receipt.mode !== mode || data.receipt.supplierId !== Number(supplierId)) throw new Error("الإيصال لا يطابق المورد الحالي.");
      setReceipt(data.receipt);
    } catch (e) { setExportError(e instanceof Error ? e.message : "تعذر فتح الإيصال."); if (e instanceof SettlementApiError && e.status === 401) setSession({ authenticated: false, csrf: null }); }
    finally { setExportBusy(false); }
  }

  async function downloadReceipt(id: string) {
    setExportBusy(true); setExportError("");
    try {
      if (!session?.csrf) throw new Error("يلزم تفويض السداد لتنزيل الإيصال.");
      await downloadSettlementReceipt(id, session.csrf);
    }
    catch (e) { setExportError(e instanceof Error ? e.message : "تعذر تنزيل الإيصال؛ لا تعِد السداد."); if (e instanceof SettlementApiError && e.status === 401) setSession({ authenticated: false, csrf: null }); }
    finally { setExportBusy(false); }
  }

  return (
    <section className="no-print mb-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="text-sm font-bold">سداد نقدي — {scopeLabel}</p>
      <p className="text-xs text-amber-900">{production ? "سداد فعلي غير قابل للتعديل أو الحذف أو الإلغاء حاليًا." : "حفظ الإنتاج غير مفعّل."}</p>
      {error ? <p role="alert" className="break-words rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</p> : null}
      {session === null ? <p className="text-xs">جاري التحقق من جلسة السداد...</p> : !session.authenticated ? (
        <form onSubmit={login} className="space-y-2">
          <label className="block text-xs font-bold">{production ? "رمز تفويض السداد" : "بيانات تفويض السداد التجريبي"}
            <input aria-label={production ? "رمز تفويض السداد" : "بيانات تفويض السداد التجريبي"} type="password" autoComplete="current-password" value={secret} onChange={e => setSecret(e.target.value)} className={`mt-1 ${inputClass}`} required minLength={12} maxLength={200} />
          </label>
          <p className="text-xs text-muted-foreground">يُحفظ تفويض هذا الجهاز لمدة 30 يومًا دون حفظ الرمز. إنهاء الجلسة يلغي التفويض.</p>
          <ActionButton label={production ? "تفويض جلسة السداد" : "تفويض الجلسة التجريبية"} icon={ShieldCheck} disabled={busy} type="submit" />
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>{names.userName} · {names.cashBookName}</span>
            <ActionButton label="إنهاء جلسة السداد" icon={LogOut} variant="outline" disabled={busy || uncertain} onClick={async () => {
              setBusy(true); setError("");
              try { await settlementRequest("/logout", {}, session.csrf!); setSession({ authenticated: false, csrf: null }); setInvoices([]); setReceipt(null); setNetRemaining(null); setHistory(null); setExportError(""); setPaymentMethod(null); }
              catch (e) { setError(e instanceof Error ? e.message : "تعذر إنهاء الجلسة."); }
              finally { setBusy(false); }
            }} />
          </div>
          {methodError ? <p role="alert" className="text-xs text-destructive">{methodError}</p> : <p className="text-xs">طريقة السداد: <strong>{paymentMethod || "النقدي فقط — جارٍ التحقق من الربط"}</strong></p>}
          {netRemaining !== null ? <p className="text-xs font-bold">صافي مديونية المشتريات: <span dir="ltr">{netRemaining}</span> د.ل</p> : null}
          <fieldset disabled={busy || uncertain} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold">مبلغ السداد<input aria-label="مبلغ السداد التجريبي" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className={`mt-1 ${inputClass}`} /></label>
              <label className="text-xs font-bold">التاريخ<input aria-label="تاريخ السداد التجريبي" type="date" value={date} onChange={e => setDate(e.target.value)} className={`mt-1 ${inputClass}`} /></label>
            </div>
            <label className="block text-xs font-bold">ملاحظة<input value={note} onChange={e => setNote(e.target.value)} maxLength={200} className={`mt-1 ${inputClass}`} /></label>
            {invoices.map(r => <div key={r.movementNo} className="rounded-lg border bg-background p-2">
              <p className="text-xs font-bold">فاتورة {r.invoiceNo} · حركة {r.movementNo}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.date.slice(0, 10)} · القيمة الأصلية: <span dir="ltr">{r.total}</span> د.ل</p>
              <p className="my-1 text-xs text-muted-foreground">المتبقي: <span dir="ltr">{r.remaining}</span> د.ل</p>
              <label className="text-xs">المخصص لهذه الفاتورة<input aria-label={`تخصيص الحركة ${r.movementNo}`} value={amounts[r.movementNo] || ""} onChange={e => setAmounts({ ...amounts, [r.movementNo]: e.target.value })} inputMode="decimal" className={`mt-1 ${inputClass}`} /></label>
              <label className="mt-2 flex items-center gap-2 text-xs"><input type="radio" name="first-invoice" aria-label={`فاتورة البداية ${r.movementNo}`} checked={firstMovement === r.movementNo} onChange={() => setFirstMovement(r.movementNo)} disabled={(settlementUnits(amounts[r.movementNo] || "") || 0n) <= 0n} />فاتورة البداية</label>
            </div>)}
            {invoicesLoaded && !invoices.length && !busy ? <p className="text-xs">لا توجد فواتير شراء مؤهلة للسداد النقدي.</p> : null}
          </fieldset>
          <p className="text-xs font-bold">الموزع: <span dir="ltr">{settlementMoney(total)}</span> د.ل · الفواتير المختارة: {selected.length}</p>
          {total > netDebt ? <p role="alert" className="text-xs font-bold text-destructive">المبلغ يتجاوز صافي المديونية.</p> : null}
          {busy ? <p role="status" className="text-xs">جاري التحقق من السداد...</p> : null}
          {uncertain ? <p className="break-all text-xs font-bold text-amber-900">لا تنشئ سدادًا آخر قبل تأكيد النتيجة. معرف الطلب: {pendingId || pending.current?.requestId}</p> : null}
          <ActionButton label={uncertain ? "التحقق من الطلب السابق" : production ? "تأكيد السداد الفعلي" : "تأكيد السداد في قاعدة الاختبار"} icon={uncertain ? RefreshCw : ShieldCheck} disabled={busy || (!uncertain && (!valid || !paymentMethod))} onClick={save} />
          {exportError ? <p role="alert" className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{exportError}</p> : null}
          {receipt ? <div className="space-y-2 rounded-lg border bg-background p-3">
            <p className="text-xs font-bold">{receipt.state === "posted" ? `تم السداد في ${scopeLabel}` : "أعيدت العملية في قاعدة الاختبار"}</p>
            <p className="text-sm font-bold">إيصال {receipt.receiptNumber} · {receipt.supplierName}</p>
            <p className="text-xs">{receipt.date.split("-").reverse().join("/")} · {receipt.paymentMethod || "غير محفوظة"}</p>
            <p className="num text-xl font-extrabold text-emerald-700">{receipt.amount} د.ل</p>
            <p className="text-xs">{receipt.note || "بدون ملاحظة"}</p>
            <p className="text-xs font-bold text-red-800">المتبقي من حساب المورد بعد السداد: <span dir="ltr">{receipt.supplierRemainingAfter ?? "غير محفوظ في هذا الإيصال"}</span>{receipt.supplierRemainingAfter !== null ? " د.ل" : ""}</p>
            <div className="space-y-1">{receipt.allocations.map(row => <p key={row.paymentId} className="text-xs">فاتورة {row.invoiceNo} · سداد {row.paymentId} · <span dir="ltr">{row.amount}</span> د.ل</p>)}</div>
            <ActionButton label="تنزيل إيصال PDF" icon={Download} variant="outline" disabled={exportBusy || receipt.state !== "posted"} onClick={() => downloadReceipt(receipt.requestId)} />
          </div> : null}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-bold">سجل إيصالات Flow {history ? `(${history.total})` : ""}</h3><ActionButton label="تحديث الإيصالات" icon={RefreshCw} variant="outline" disabled={historyBusy} onClick={() => loadHistory(history?.page || 1)} /></div>
            {historyError ? <p role="alert" className="text-xs text-destructive">{historyError}</p> : null}
            {historyBusy ? <p role="status" className="text-xs">جاري تحميل الإيصالات...</p> : null}
            {history && !history.rows.length ? <p className="text-xs text-muted-foreground">لا توجد إيصالات Flow محفوظة لهذا المورد.</p> : null}
            {history?.rows.map(row => <div key={row.requestId} className="flex items-center justify-between gap-2 rounded-lg border bg-background p-2">
              <button type="button" onClick={() => openReceipt(row.requestId)} disabled={exportBusy} className="min-w-0 flex-1 text-start text-xs"><strong>إيصال {row.receiptNumber}</strong><span className="mt-1 block">{row.date.split("-").reverse().join("/")} · {row.amount} د.ل</span></button>
              <button type="button" aria-label={`تنزيل إيصال ${row.receiptNumber}`} title="تنزيل PDF" onClick={() => downloadReceipt(row.requestId)} disabled={exportBusy || row.state !== "posted"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border disabled:opacity-50"><Download size={16} /></button>
            </div>)}
            {history && history.total > history.pageSize ? <div className="flex items-center justify-between"><button type="button" aria-label="الإيصالات السابقة" disabled={historyBusy || history.page === 1} onClick={() => loadHistory(history.page - 1)} className="p-2 disabled:opacity-40"><ChevronRight size={18} /></button><span className="text-xs">{history.page} / {Math.ceil(history.total / history.pageSize)}</span><button type="button" aria-label="الإيصالات التالية" disabled={historyBusy || history.page * history.pageSize >= history.total} onClick={() => loadHistory(history.page + 1)} className="p-2 disabled:opacity-40"><ChevronLeft size={18} /></button></div> : null}
          </div>
        </>
      )}
    </section>
  );
}
