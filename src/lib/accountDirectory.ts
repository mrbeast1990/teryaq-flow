export type AccountKind = "customer" | "supplier";
export type AccountState = "active" | "closed" | "all";
export type AccountOrdering = {
  primarySort: "balance" | "payment";
  secondarySort: "none" | "balance" | "payment";
  balanceDirection: "asc" | "desc";
  paymentDirection: "asc" | "desc";
  paymentFilter: "all" | "none";
};
export type AccountDirectoryFilters = AccountOrdering & {
  kind: AccountKind;
  state: AccountState;
  balanceFilter: string;
  search: string;
  page: number;
  pageSize: number;
};
export type AccountMetadata = {
  sourceId: string;
  kind: AccountKind;
  personNo: number;
  closed: boolean;
  phone: string | null;
  originalPhone: string | null;
  revision: number;
  updatedAt: string;
  updatedBy: string;
};

export function accountMetadataKey(sourceId: string, kind: AccountKind, personNo: number) {
  if (
    !/^[a-f0-9]{64}$/.test(sourceId) ||
    !["customer", "supplier"].includes(kind) ||
    !Number.isSafeInteger(personNo) ||
    personNo < 1
  ) {
    throw new Error("هوية الحساب غير صحيحة.");
  }
  return `${sourceId}:${kind}:${personNo}`;
}

export function libyaWhatsappNumber(phone: string) {
  let digits = phone
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[\s()+.-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0\d{9}$/.test(digits)) digits = `218${digits.slice(1)}`;
  else if (/^9\d{8}$/.test(digits)) digits = `218${digits}`;
  return /^218\d{8,9}$/.test(digits) ? digits : null;
}

export function usablePhone(phone?: string | null) {
  return typeof phone === "string" && /[0-9٠-٩۰-۹]{3}/.test(phone) && !/[<>\r\n]/.test(phone);
}
