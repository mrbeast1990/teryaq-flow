import { PrintFooter } from "@/components/teryaq/print/PrintHeader";
import { usePrintSettings } from "@/lib/printSettings";
import "./SupplierPaymentPrintReceipt.css";

interface Props {
  paymentNo: string | number;
  supplierName: string;
  supplierId?: string | number | null | undefined;
  date?: string | null | undefined;
  time?: string | null | undefined;
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
  return (
    <article className="supplier-payment-print" dir="rtl" aria-label="إيصال سداد مورد">
      <header className="print-doc-header supplier-payment-print__header">
        <img src={settings.logoDataUrl || "/icons/icon-192.png"} alt="شعار الصيدلية" />
        <div>
          <h1>{settings.pharmacyName || "صيدلية الترياق الشافي"}</h1>
          <h2>إيصال سداد مورد</h2>
          {settings.secondaryLine ? <p>{settings.secondaryLine}</p> : null}
          {settings.address || settings.phone ? <p>{[settings.address, settings.phone].filter(Boolean).join(" · ")}</p> : null}
          {settings.commercialText ? <p>{settings.commercialText}</p> : null}
        </div>
      </header>
      <section className="supplier-payment-print__meta">
        <div><span>رقم الإيصال: </span><strong className="supplier-payment-print__number">{props.paymentNo}</strong></div>
        <div><span>تاريخ السداد: </span><strong className="supplier-payment-print__number">{accountingDate(props.date)}</strong></div>
        <div className="supplier-payment-print__wide"><span>المورد: </span><strong>{props.supplierName}</strong>{props.supplierId ? <span> ({props.supplierId})</span> : null}</div>
        <div><span>طريقة السداد: </span><strong>{props.paymentMethod}</strong></div>
        {props.time ? <div><span>وقت التسجيل: </span><strong>{props.time}</strong></div> : null}
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
      <p className="supplier-payment-print__notice">هذا الإيصال يخص حركة السداد المحددة فقط. المتبقي وقت السداد غير متاح ضمن بيانات هذه الحركة.</p>
      <PrintFooter />
    </article>
  );
}
