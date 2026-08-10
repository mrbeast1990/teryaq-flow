export * from "./config";
export * from "./client";

export interface SystemStatus {
  connected: boolean;
  databaseName?: string;
  serverTime?: string;
}

export interface RevenueMovement {
  id: string | number;
  label: string;
  time?: string;
  customer?: string;
  invoiceNo?: string;
  amount: number;
  sourceBadge?: string;
}

export interface RevenueSource {
  name: string;
  total: number;
  movements?: RevenueMovement[];
}

export interface RevenuePeriod {
  periodName: string; // or userName
  total: number;
  sources: RevenueSource[];
}

export interface RevenueDetailsResponse {
  summary: {
    netFinalRevenue: number;
    cashSales: number;
    electronicPayments: number;
    debtorPayments: number;
    returns: number;
  };
  periods: RevenuePeriod[];
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { API_ENDPOINTS } = await import("./config");
  const { apiRequest } = await import("./client");
  return apiRequest<SystemStatus>(API_ENDPOINTS.status());
}

export async function getRevenueDetails(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<RevenueDetailsResponse> {
  const { API_ENDPOINTS } = await import("./config");
  const { apiRequest } = await import("./client");
  return apiRequest<RevenueDetailsResponse>(API_ENDPOINTS.revenueDetails(), { query: params });
}
