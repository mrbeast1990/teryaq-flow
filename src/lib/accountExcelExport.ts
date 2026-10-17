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

export function accountElapsedText(value?: string | null, now = new Date()) {
  const date = accountingDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tripoli",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((value) => value.type === type)?.value);
  const today = Date.UTC(part("year"), part("month") - 1, part("day"));
  const days = Math.round((today - date.getTime()) / 86400000);
  if (days < 0) return "تاريخ مستقبلي";
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  return `منذ ${days} ${days <= 10 ? "أيام" : "يومًا"}`;
}

export function accountExportHeaders(kind: AccountKind) {
  return [
    "الاسم",
    "الهاتف",
    "الرصيد",
    "حالة الحساب",
    kind === "customer" ? "آخر بيع" : "آخر شراء",
    "المدة",
    kind === "customer" ? "آخر تحصيل" : "آخر سداد",
    "المدة",
  ];
}

export function accountSheetData(rows: DirectoryAccount[], kind: AccountKind, now = new Date()) {
  const customer = kind === "customer";
  const dateCell = (value?: string | null) => {
    const date = accountingDate(value);
    return date ? { type: Date, value: date, format: "dd/mm/yyyy" } : null;
  };
  const elapsedCell = (value?: string | null) => {
    const elapsed = accountElapsedText(value, now);
    return elapsed
      ? { type: String, value: elapsed, textColor: "#B91C1C", fontWeight: "bold" as const }
      : null;
  };
  return [
    accountExportHeaders(kind).map((value) => ({
      type: String,
      value,
      fontWeight: "bold" as const,
    })),
    ...rows.map((row) => [
      { type: String, value: row.name || "" },
      { type: String, value: row.phone || "" },
      { type: Number, value: row.currentBalance ?? 0 },
      { type: String, value: row.closed ? "معطّل" : "نشط" },
      dateCell(customer ? row.lastSaleDate : row.lastPurchaseDate),
      elapsedCell(customer ? row.lastSaleDate : row.lastPurchaseDate),
      dateCell(customer ? row.lastCollectionDate : row.lastPaymentDate),
      elapsedCell(customer ? row.lastCollectionDate : row.lastPaymentDate),
    ]),
  ];
}

export async function accountExcelBlob(
  rows: DirectoryAccount[],
  kind: AccountKind,
  now = new Date(),
) {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  const { findElement, prependMarkupInsideElement } = await import("write-excel-file/utility");
  return writeExcelFile(
    accountSheetData(rows, kind, now),
    {
      sheet: kind === "customer" ? "الزبائن" : "الموردون",
      rightToLeft: true,
      orientation: "landscape",
      columns: [
        { width: 32 },
        { width: 22 },
        { width: 20 },
        { width: 15 },
        { width: 18 },
        { width: 22 },
        { width: 18 },
        { width: 22 },
      ],
    },
    {
      features: [
        {
          files: {
            transform: {
              "xl/worksheets/sheet{id}.xml": {
                transform: (xml) => {
                  const worksheet = findElement(xml, "worksheet");
                  if (!worksheet) throw new Error("تعذر تجهيز إعدادات طباعة Excel.");
                  return prependMarkupInsideElement(
                    xml,
                    worksheet,
                    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>',
                  );
                },
                transformElementAttributes: (tag, attributes) =>
                  tag === "pageSetup"
                    ? { ...attributes, fitToWidth: 1, fitToHeight: 0 }
                    : attributes,
              },
            },
          },
        },
      ],
    },
  ).toBlob();
}
