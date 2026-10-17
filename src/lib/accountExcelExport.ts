import type { DirectoryAccount } from "./accountDirectoryApi";
import type { AccountKind } from "./accountDirectory";

// Accounting dates are calendar dates: do not shift them to the device time zone.
export function accountingDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:$|T| )/.exec(value.trim());
  if (!parts) throw new Error("تاريخ حركة غير صالح في بيانات التصدير.");
  const year = Number(parts[1]),
    month = Number(parts[2]),
    day = Number(parts[3]);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    year < 1 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("تاريخ حركة غير صالح في بيانات التصدير.");
  }
  return date;
}

export function accountingDateText(value?: string | null) {
  const date = accountingDate(value);
  return date
    ? `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
    : "";
}

export function accountSheetData(rows: DirectoryAccount[], kind: AccountKind) {
  const customer = kind === "customer";
  const dateCell = (value?: string | null) => {
    const date = accountingDate(value);
    return date ? { type: Date, value: date, format: "dd/mm/yyyy" } : null;
  };
  return [
    [
      "الاسم",
      "الهاتف",
      "الرصيد",
      "حالة الحساب",
      customer ? "آخر بيع" : "آخر شراء",
      customer ? "آخر تحصيل" : "آخر سداد",
    ].map((value) => ({ type: String, value, fontWeight: "bold" as const })),
    ...rows.map((row) => [
      { type: String, value: row.name || "" },
      { type: String, value: row.phone || "" },
      { type: Number, value: row.currentBalance ?? 0 },
      { type: String, value: row.closed ? "معطّل" : "نشط" },
      dateCell(customer ? row.lastSaleDate : row.lastPurchaseDate),
      dateCell(customer ? row.lastCollectionDate : row.lastPaymentDate),
    ]),
  ];
}

export async function accountExcelBlob(rows: DirectoryAccount[], kind: AccountKind) {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  return writeExcelFile(accountSheetData(rows, kind), {
    sheet: kind === "customer" ? "الزبائن" : "الموردون",
    rightToLeft: true,
    columns: [
      { width: 32 },
      { width: 22 },
      { width: 20 },
      { width: 15 },
      { width: 18 },
      { width: 18 },
    ],
  }).toBlob();
}
