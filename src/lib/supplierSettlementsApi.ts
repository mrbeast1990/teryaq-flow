import { getApiBaseUrl } from "@/lib/api/config";
import { readPrintSettings } from "@/lib/printSettings";

export interface SettlementInvoice {
  movementNo: number; invoiceNo: number; date: string; caseInvoice: boolean; closeInvoice: boolean;
  total: string; paid: string; remaining: string; invalidUnits: number; invalidLinks: number;
}
export type SettlementMode = "sandbox" | "production";
export interface SettlementCapabilities {
  mode: SettlementMode | "disabled"; productionSaving: boolean; unavailableCode?: string;
}
export interface CashSettlementRequest {
  requestId: string; supplierId: number; amount: string; date: string; note: string; paymentType: "cash";
  allocations: { movementNo: number; amount: string }[];
}
export interface CashSettlementReceipt {
  requestId: string; state: "posted" | "restored"; mode: SettlementMode; supplierId: number; supplierName: string;
  amount: string; date: string; note: string; userName: string; cashBookName: string;
  receiptNumber: number; paymentMethod: string | null; allocatedRemainingAfter: string | null; supplierRemainingAfter: string | null;
  allocations: { movementNo: number; invoiceNo: number; amount: string; paymentId: number; remainingAfter: string }[];
}
export interface SettlementHistory {
  page: number; pageSize: number; total: number;
  rows: Pick<CashSettlementReceipt, "requestId" | "receiptNumber" | "date" | "amount" | "state" | "paymentMethod">[];
}

export async function downloadSettlementReceipt(requestId: string, csrf: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/supplier-settlements/payments/${encodeURIComponent(requestId)}/receipt.pdf`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-settlement-csrf": csrf },
    body: JSON.stringify({ logoDataUrl: readPrintSettings().logoDataUrl }),
    credentials: "include", cache: "no-store", signal: AbortSignal.timeout(45000),
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
    const value = await response.json().catch(() => null);
    throw new SettlementApiError(value?.message || "تعذر تنزيل الإيصال. لا تعِد السداد؛ جرّب التنزيل من السجل لاحقًا.", response.status, value?.code || "PDF_UNAVAILABLE");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `supplier-payment-${requestId}.pdf`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export class SettlementApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

export async function settlementRequest<T>(path: string, body?: unknown, csrf?: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/supplier-settlements${path}`, {
    method: body === undefined ? "GET" : "POST", credentials: "include", cache: "no-store",
    headers: body === undefined ? {} : { "Content-Type": "application/json", ...(csrf ? { "x-settlement-csrf": csrf } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000),
  });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("تعذر الاتصال بخدمة السداد.");
  const value = await response.json();
  if (!response.ok || !value.success) throw new SettlementApiError(value.message || "تعذر تأكيد نتيجة السداد. لا تنشئ طلبًا جديدًا قبل التحقق.", response.status, value.code || "UNKNOWN");
  return value as T;
}

export function settlementUnits(value: string): bigint | null {
  if (!/^\d{1,10}(\.\d{1,4})?$/.test(value)) return null;
  const [whole, part = ""] = value.split(".");
  return BigInt(whole || "0") * 10000n + BigInt(part.padEnd(4, "0"));
}

export function settlementMoney(value: bigint) {
  return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`;
}
