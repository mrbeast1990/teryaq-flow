import { useEffect, useState } from "react";
import { usePrintSettings } from "@/lib/printSettings";
import { settlementRequest, type CashSettlementReceipt } from "@/lib/supplierSettlementsApi";
import "./SupplierPaymentPrintReceipt.css";

interface Props {
  paymentNo: string | number;
  supplierName: string;
  supplierId?: string | number | null | undefined;
  date?: string | null | undefined;
  amount: number;
  paymentMethod: string;
  notes?: string | null | undefined;
  recordedBy?: string | null | undefined;
  invoiceMovementNo?: string | number | null | undefined;
}

function accountingDate(value: Props["date"]) {
  const day = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value || "");
  return day ? `${day[3]}/${day[2]}/${day[1]}` : value || "غير متاح";
}

function money(value: number) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)
    : "غير متاح";
}

export function SupplierPaymentPrintReceipt(props: Props) {
  const settings = usePrintSettings();
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"loading" | "locked" | "missing" | "error" | "ready">("loading");
  useEffect(() => {
    let active = true;
    setBalance(null); setBalanceStatus("loading");
    (async () => {
      const session = await settlementRequest<{ authenticated: boolean }>("/session");
      if (!session.authenticated || !props.supplierId) { if (active) setBalanceStatus(session.authenticated ? "missing" : "locked"); return; }
      const result = await settlementRequest<{ receipt: CashSettlementReceipt | null }>(`/receipts/by-payment/${encodeURIComponent(props.paymentNo)}?supplierId=${encodeURIComponent(props.supplierId)}`);
      if (active) {
        setBalance(result.receipt?.supplierRemainingAfter ?? null);
        setBalanceStatus(result.receipt?.supplierRemainingAfter != null ? "ready" : "missing");
      }
    })().catch(() => { if (active) setBalanceStatus("error"); });
    return () => { active = false; };
  }, [props.paymentNo, props.supplierId]);
  return (
    <article className="supplier-payment-print" dir="rtl" aria-label="إيصال سداد مورد">
      <header className="print-doc-header supplier-payment-print__header">
        {settings.logoDataUrl ? <img src={settings.logoDataUrl} alt="شعار الصيدلية" /> : null}
        <div>
          <h1>صيدلية الترياق الشافي</h1>
          <h2>إيصال سداد مورد</h2>
        </div>
      </header>
      <section className="supplier-payment-print__meta">
        <div><span>رقم الإيصال: </span><strong className="supplier-payment-print__number">{props.paymentNo}</strong></div>
        <div><span>تاريخ السداد: </span><strong className="supplier-payment-print__number">{accountingDate(props.date)}</strong></div>
        <div className="supplier-payment-print__wide"><span>المورد: </span><strong>{props.supplierName}</strong>{props.supplierId ? <span> ({props.supplierId})</span> : null}</div>
        <div><span>طريقة السداد: </span><strong>{props.paymentMethod}</strong></div>
        <div className="supplier-payment-print__wide"><span>الملاحظة: </span>{props.notes || "-"}</div>
        {props.recordedBy ? <div className="supplier-payment-print__wide"><span>سُجّل بواسطة: </span>{props.recordedBy}</div> : null}
      </section>
      <section className="supplier-payment-print__amount">
        <span>المبلغ المسدد</span>
        <strong><bdi className="supplier-payment-print__number">{money(props.amount)}</bdi> د.ل</strong>
      </section>
      <table className="supplier-payment-print__table">
        <thead><tr><th>حركة الفاتورة المرتبطة</th><th>رقم السداد</th><th>المبلغ المسدد</th></tr></thead>
        <tbody><tr>
          <td className="supplier-payment-print__number">{props.invoiceMovementNo || "غير مرتبطة"}</td>
          <td className="supplier-payment-print__number">{props.paymentNo}</td>
          <td className="supplier-payment-print__number">{money(props.amount)}</td>
        </tr></tbody>
      </table>
      <p className="supplier-payment-print__balance">المتبقي من حساب المورد بعد السداد: <strong>{balanceStatus === "ready" ? <><bdi>{balance}</bdi> د.ل</> : balanceStatus === "loading" ? "جاري التحقق..." : balanceStatus === "error" ? "تعذر التحقق" : balanceStatus === "locked" ? "يلزم تفويض السداد للتحقق" : "غير محفوظ في هذا الإيصال"}</strong></p>
      <footer className="supplier-payment-print__footer"><span>أجدابيا حي 7 أكتوبر</span><bdi>0915938155</bdi></footer>
    </article>
  );
}
