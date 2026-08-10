/**
 * Central API configuration.
 * The base URL is provided via the VITE_API_BASE_URL environment variable.
 * Never hard-code hosts, IPs or localhost inside components.
 */
export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") || "";

/** Whether a real API base URL is configured. While false, screens may use demo data. */
export const IS_API_CONFIGURED = API_BASE_URL.length > 0;

/** Cloudflare Access needs cookies; local development with CORS * must not send credentials. */
export const API_USES_BROWSER_CREDENTIALS = /^https:\/\/dashboard\.altiryaq-pharma\.com/i.test(API_BASE_URL);

/** Default request timeout in milliseconds. */
export const API_TIMEOUT_MS = 20000;

/**
 * All known endpoints of the existing Teryaq SQL Connector API.
 * No responses are implemented in this phase.
 */
export const API_ENDPOINTS = {
  status: () => "/api/status",
  revenueDetails: () => "/api/revenue-details",
  tradingProfit: () => "/api/trading-profit",
  customers: () => "/api/customers",
  suppliers: () => "/api/suppliers",
  itemsStock: () => "/api/items/stock",
  itemsTrack: () => "/api/items/track",
  itemsOutOfStock: () => "/api/items/out-of-stock",
  itemsExpiry: () => "/api/items/expiry",
  salesInvoice: (movementNo: string | number) => `/api/invoices/sales/${movementNo}`,
  purchaseInvoice: (movementNo: string | number) => `/api/invoices/purchases/${movementNo}`,
} as const;
