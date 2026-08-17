/**
 * Central API configuration.
 *
 * Local development may use VITE_API_BASE_URL=http://127.0.0.1:3001.
 * Public Flow runs the frontend and API on the same origin, so it must always
 * call relative /api paths even when the local dev server has .env.local loaded.
 */
const ENV_API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") || "";

function isFlowSameOriginHost() {
  return typeof window !== "undefined" && window.location.hostname === "flow.altiryaq-pharma.com";
}

export function getApiBaseUrl(): string {
  return isFlowSameOriginHost() ? "" : ENV_API_BASE_URL;
}

export const API_BASE_URL: string = getApiBaseUrl();

/** Same-origin /api is valid in production; local development may override with VITE_API_BASE_URL. */
export const IS_API_CONFIGURED = true;

/** Cloudflare Access uses the browser session on same-origin production. */
export function getApiCredentialsMode(): RequestCredentials {
  const baseUrl = getApiBaseUrl();
  if (baseUrl.length === 0) return "same-origin";
  if (/^https:\/\/(?:dashboard|flow)\.altiryaq-pharma\.com/i.test(baseUrl)) return "include";
  return "omit";
}

export const API_USES_BROWSER_CREDENTIALS = getApiCredentialsMode() !== "omit";

/** Default request timeout in milliseconds. */
export const API_TIMEOUT_MS = 20000;

/**
 * All known endpoints of the existing Teryaq SQL Connector API.
 * No responses are implemented in this phase.
 */
export const API_ENDPOINTS = {
  status: () => "/api/status",
  connections: () => "/api/connections",
  testConnection: () => "/api/test-connection",
  saveConnection: () => "/api/save-connection",
  useConnection: (id: string) => `/api/connections/${encodeURIComponent(id)}/use`,
  revenueDetails: () => "/api/revenue-details",
  revenueMovementDetails: (movementNo: string | number) => `/api/revenue-movement/${movementNo}`,
  tradingProfit: () => "/api/trading-profit",
  analyticsDailyProfit: () => "/api/analytics/daily-profit",
  analyticsGlobalSearch: () => "/api/analytics/global-search",
  analyticsComparePeriods: () => "/api/analytics/compare-periods",
  analyticsPriceChanges: () => "/api/analytics/price-changes",
  analyticsAlerts: () => "/api/analytics/alerts",
  analyticsItemProfit: () => "/api/analytics/item-profit",
  customers: () => "/api/customers",
  suppliers: () => "/api/suppliers",
  customerDetails: (id: string | number) => `/api/customer/${encodeURIComponent(String(id))}`,
  customerLedger: (id: string | number) => `/api/customer/${encodeURIComponent(String(id))}/ledger`,
  customerInvoices: (id: string | number) => `/api/customer/${encodeURIComponent(String(id))}/invoices`,
  customerReceipts: (id: string | number) => `/api/customer/${encodeURIComponent(String(id))}/receipts`,
  supplierLedger: (id: string | number) => `/api/supplier/${encodeURIComponent(String(id))}/ledger`,
  supplierInvoices: (id: string | number) => `/api/supplier/${encodeURIComponent(String(id))}/invoices`,
  supplierPayments: (id: string | number) => `/api/supplier/${encodeURIComponent(String(id))}/payments`,
  itemsSummary: () => "/api/items/summary",
  itemsStock: () => "/api/items/stock",
  itemsTrack: () => "/api/items/track",
  itemsOutOfStock: () => "/api/items/out-of-stock",
  itemsExpiry: () => "/api/items/expiry",
  salesInvoice: (movementNo: string | number) => `/api/invoices/sales/${movementNo}`,
  purchaseInvoice: (movementNo: string | number) => `/api/invoices/purchases/${movementNo}`,
  reportSales: () => "/api/reports/sales",
  reportPurchases: () => "/api/reports/purchases",
} as const;
