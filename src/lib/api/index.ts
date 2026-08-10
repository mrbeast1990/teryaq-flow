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

export function getSystemStatus(): Promise<SystemStatus> {
  return apiRequest<SystemStatus>(API_ENDPOINTS.status());
}

export function getRevenueDetails(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<RevenueDetailsResponse> {
  return apiRequest<RevenueDetailsResponse>(API_ENDPOINTS.revenueDetails(), { query: params });
}
