import type { DirectoryAccount } from "./accountDirectoryApi";
import type { AccountKind } from "./accountDirectory";
import { accountingDateText, accountElapsedText, accountExportHeaders } from "./accountExcelExport";

const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

export function accountReportPrintHtml(
  rows: DirectoryAccount[],
  kind: AccountKind,
  title: string,
  now = new Date(),
) {
  const customer = kind === "customer";
  const amount = (value: number) =>
    new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 3 }).format(value);
  const body = rows
    .map((row) => {
      const trade = customer ? row.lastSaleDate : row.lastPurchaseDate;
      const payment = customer ? row.lastCollectionDate : row.lastPaymentDate;
      const values = [
        row.name || "",
        row.phone || "",
        String(row.currentBalance ?? 0),
        row.closed ? "معطّل" : "نشط",
        accountingDateText(trade),
        accountElapsedText(trade, now),
        accountingDateText(payment),
        accountElapsedText(payment, now),
      ];
      return `<tr>${values.map((value, index) => `<td${index === 5 || index === 7 ? ' class="elapsed"' : index === 1 || index === 2 || index === 4 || index === 6 ? ' class="numeric"' : ""}>${escape(value)}</td>`).join("")}</tr>`;
    })
    .join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #111827; font: 12px Cairo, Arial, sans-serif; }
    main { width: 100%; max-width: 277mm; margin: 0 auto; }
    h1 { font-size: 19px; margin: 0 0 6px; } p { margin: 0 0 8px; overflow-wrap: anywhere; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    th, td { border: 1px solid #d1d5db; padding: 5px; text-align: right; vertical-align: top; overflow-wrap: anywhere; line-height: 1.7; }
    th { background: #f3f4f6; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .elapsed { color: #B91C1C; font-weight: 700; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .numeric { direction: ltr; text-align: center; }
  </style></head><body><main><h1>صيدلية الترياق الشافي</h1><p>${escape(title)}</p><p>العدد: ${rows.length} — مجموع الرصيد: ${amount(rows.reduce((sum, row) => sum + Number(row.currentBalance || 0), 0))}</p>
  <table><colgroup>${[20, 12, 18, 6, 11, 11, 11, 11].map((width) => `<col style="width:${width}%">`).join("")}</colgroup><thead><tr>${accountExportHeaders(
    kind,
  )
    .map((value) => `<th>${escape(value)}</th>`)
    .join("")}</tr></thead><tbody>${body}</tbody></table></main></body></html>`;
}
