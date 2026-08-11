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

export interface AccountPerson {
  id: number | string;
  name: string;
  phone?: string | null;
  address?: string | null;
  currentBalance: number;
  lastTransactionDate?: string | null;
  lastTransactionAmount?: number | null;
}

export interface AccountsListResponse {
  success: boolean;
  profile?: string;
  customers?: AccountPerson[];
  suppliers?: AccountPerson[];
}

export interface CustomerDetailsResponse {
  success: boolean;
  profile?: string;
  customer: Omit<AccountPerson, "currentBalance" | "lastTransactionDate" | "lastTransactionAmount">;
}

export interface StatementRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  refNo?: number | string | null;
  rowType?: "sales-invoice" | "purchase-invoice" | "payment" | string;
  runningBalance: number;
}

export interface RowsResponse<T> {
  success: boolean;
  profile?: string;
  rows: T[];
}

export interface CustomerInvoiceRow {
  invoiceNumber: number | string;
  accountNo?: number | string;
  date: string;
  total: number;
  paid: number;
  remaining: number;
}

export interface SupplierInvoiceRow {
  invoiceNumber: number | string;
  purchaseInvoice?: number | string | null;
  date: string;
  invoiceType?: string;
  total: number;
  paid: number;
  remaining: number;
}

export interface CustomerReceiptRow {
  receiptNumber: string;
  date: string;
  amount: number;
  notes?: string | null;
}

export interface SupplierPaymentRow {
  paymentNumber: string;
  date: string;
  amount: number;
  paymentMethod?: string | null;
  invoiceNumber?: number | string | null;
  notes?: string | null;
}

export interface InvoiceHeader {
  movementNo: number | string;
  invoiceNo: number | string;
  date: string;
  personNo?: number | string;
  personName?: string;
  accountNo?: number | string;
  accountLabel?: string;
  total: number;
  notes?: string | null;
}

export interface InvoiceItemRow {
  itemNo: number | string;
  itemName: string;
  barcode?: string | null;
  unitName?: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceDetailsResponse {
  success: boolean;
  profile?: string;
  header: InvoiceHeader;
  items: InvoiceItemRow[];
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
  return getCustomers().then((response) => {
    const customers = response.customers || [];
    return {
      success: response.success,
      totalBalance: customers.reduce((sum, item) => sum + Number(item.currentBalance || 0), 0),
      count: customers.length,
    };
  });
}

export function getSupplierPayables(): Promise<GenericBalanceResponse> {
  return getSuppliers().then((response) => {
    const suppliers = response.suppliers || [];
    return {
      success: response.success,
      totalBalance: suppliers.reduce((sum, item) => sum + Number(item.currentBalance || 0), 0),
      count: suppliers.length,
    };
  });
}

export function getCustomers(params: { search?: string } = {}): Promise<AccountsListResponse> {
  return apiRequest<AccountsListResponse>(API_ENDPOINTS.customers(), { query: params });
}

export function getSuppliers(params: { search?: string } = {}): Promise<AccountsListResponse> {
  return apiRequest<AccountsListResponse>(API_ENDPOINTS.suppliers(), { query: params });
}

export function getCustomerDetails(id: string | number): Promise<CustomerDetailsResponse> {
  return apiRequest<CustomerDetailsResponse>(API_ENDPOINTS.customerDetails(id));
}

export function getCustomerLedger(id: string | number): Promise<RowsResponse<StatementRow>> {
  return apiRequest<RowsResponse<StatementRow>>(API_ENDPOINTS.customerLedger(id));
}

export function getCustomerInvoices(id: string | number): Promise<RowsResponse<CustomerInvoiceRow>> {
  return apiRequest<RowsResponse<CustomerInvoiceRow>>(API_ENDPOINTS.customerInvoices(id));
}

export function getCustomerReceipts(id: string | number): Promise<RowsResponse<CustomerReceiptRow>> {
  return apiRequest<RowsResponse<CustomerReceiptRow>>(API_ENDPOINTS.customerReceipts(id));
}

export function getSupplierLedger(id: string | number): Promise<RowsResponse<StatementRow>> {
  return apiRequest<RowsResponse<StatementRow>>(API_ENDPOINTS.supplierLedger(id));
}

export function getSupplierInvoices(id: string | number): Promise<RowsResponse<SupplierInvoiceRow>> {
  return apiRequest<RowsResponse<SupplierInvoiceRow>>(API_ENDPOINTS.supplierInvoices(id));
}

export function getSupplierPayments(id: string | number): Promise<RowsResponse<SupplierPaymentRow>> {
  return apiRequest<RowsResponse<SupplierPaymentRow>>(API_ENDPOINTS.supplierPayments(id));
}

export function getSalesInvoice(movementNo: string | number): Promise<InvoiceDetailsResponse> {
  return apiRequest<InvoiceDetailsResponse>(API_ENDPOINTS.salesInvoice(movementNo));
}

export function getPurchaseInvoice(movementNo: string | number): Promise<InvoiceDetailsResponse> {
  return apiRequest<InvoiceDetailsResponse>(API_ENDPOINTS.purchaseInvoice(movementNo));
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
