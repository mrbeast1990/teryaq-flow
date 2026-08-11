export * from "./config";
export * from "./client";

import { API_ENDPOINTS } from "./config";
import { apiRequest } from "./client";

export interface SystemStatus {
  success: boolean;
  profile?: string;
  connected: boolean;
  status?: string;
  server?: string;
  database?: string;
  databaseName?: string;
  message?: string;
  backend?: {
    host?: string;
    port?: number;
    version?: string;
  };
  lastConnectionTime?: string;
}

export interface SavedConnection {
  id: string;
  name: string;
  server: string;
  database: string;
  user?: string;
  port?: number | null;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  tdsVersion?: string;
  lastConnectionAt?: string | null;
}

export interface ConnectionsResponse {
  success: boolean;
  activeConnectionId: string | null;
  connections: SavedConnection[];
}

export interface ConnectionPayload {
  id?: string;
  name?: string;
  server: string;
  database: string;
  user?: string;
  password?: string;
  port?: number | null;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  tdsVersion?: string;
}

export interface ConnectionActionResponse {
  success: boolean;
  message: string;
  connection: SystemStatus;
}

export interface RevenueSummary {
  cashSalesTotal: number;
  debtorPaymentsTotal: number;
  returnsTotal: number;
  electronicPaymentsTotal: number;
  netRevenue: number;
  movementCount: number;
  expectedTotal: number | null;
  difference: number;
}

export interface RevenueSourceTotal {
  sourceName: string;
  total: number;
  movementCount: number;
}

export interface RevenueSellerTotal {
  sellerId: number | string;
  sellerName: string;
  total: number;
  movementCount: number;
}

export interface RevenueMovementRow {
  movementNo: number | string;
  invoiceNo: number | string;
  movementDate: string;
  movementType: string;
  customerName: string;
  sellerId: number | string;
  sellerName: string;
  paymentMethod: string;
  amount: number;
  period: string;
  notes?: string;
  revenueSource: string;
  accountNo?: number | string;
  accountName?: string;
  documentNo?: string;
  documentKind?: string;
  documentSide?: string;
}

export interface RevenueFilterOption {
  optionType: "movementType" | "paymentMethod" | "period" | "seller" | string;
  optionValue: string;
  optionLabel: string;
}

export interface RevenueDetailsResponse {
  success: boolean;
  profile?: string;
  selectedDate?: string;
  dateFrom: string;
  dateTo: string;
  filters?: {
    sellerId?: string;
    period?: string;
    paymentMethod?: string;
    movementType?: string;
  };
  summary: RevenueSummary;
  sources: RevenueSourceTotal[];
  sellerTotals: RevenueSellerTotal[];
  filterOptions?: RevenueFilterOption[];
  rows: RevenueMovementRow[];
}

export interface TradingProfitResponse {
  success: boolean;
  profit: number;
  margin?: number;
}

export interface GenericBalanceResponse {
  success: boolean;
  totalBalance: number;
  count: number;
}

export interface StockInfoResponse {
  success: boolean;
  count: number;
}

export function getSystemStatus(): Promise<SystemStatus> {
  return apiRequest<SystemStatus>(API_ENDPOINTS.status());
}

export function getConnections(): Promise<ConnectionsResponse> {
  return apiRequest<ConnectionsResponse>(API_ENDPOINTS.connections());
}

export function testConnection(payload: ConnectionPayload): Promise<ConnectionActionResponse> {
  return apiRequest<ConnectionActionResponse>(API_ENDPOINTS.testConnection(), {
    method: "POST",
    body: payload,
  });
}

export function saveConnection(payload: ConnectionPayload): Promise<ConnectionActionResponse> {
  return apiRequest<ConnectionActionResponse>(API_ENDPOINTS.saveConnection(), {
    method: "POST",
    body: payload,
  });
}

export function useConnection(id: string): Promise<ConnectionActionResponse> {
  return apiRequest<ConnectionActionResponse>(API_ENDPOINTS.useConnection(id), {
    method: "POST",
  });
}

export function getRevenueDetails(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<RevenueDetailsResponse> {
  return apiRequest<RevenueDetailsResponse>(API_ENDPOINTS.revenueDetails(), { query: params });
}

export function getTradingProfit(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<TradingProfitResponse> {
  return apiRequest<TradingProfitResponse>(API_ENDPOINTS.tradingProfit(), { query: params });
}

export function getCustomerBalances(): Promise<GenericBalanceResponse> {
  return apiRequest<GenericBalanceResponse>(API_ENDPOINTS.customers());
}

export function getSupplierPayables(): Promise<GenericBalanceResponse> {
  return apiRequest<GenericBalanceResponse>(API_ENDPOINTS.suppliers());
}

export function getOutOfStock(): Promise<StockInfoResponse> {
  return apiRequest<StockInfoResponse>(API_ENDPOINTS.itemsOutOfStock());
}

export function getLowStock(): Promise<StockInfoResponse> {
  return apiRequest<StockInfoResponse>(API_ENDPOINTS.itemsStock());
}

export function getExpiryItems(): Promise<StockInfoResponse> {
  return apiRequest<StockInfoResponse>(API_ENDPOINTS.itemsExpiry());
}
