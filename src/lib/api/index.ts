export * from "./config";
export * from "./client";

import { API_ENDPOINTS } from "./config";
import { apiRequest } from "./client";

export interface SystemStatus {
  success: boolean;
  profile?: string | null | undefined;
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

export interface RevenueSellerSourceTotal {
  sellerId: number | string;
  sellerName: string;
  revenueSource: string;
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
  profile?: string | null | undefined;
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
  sellerSourceTotals?: RevenueSellerSourceTotal[];
  filterOptions?: RevenueFilterOption[];
  rows: RevenueMovementRow[];
}

export interface RevenueMovementDetailsResponse {
  success: boolean;
  profile?: string | null | undefined;
  movement?: {
    movementNo: number | string;
    invoiceNo?: number | string | null;
    movementDate?: string | null;
    movementCreatedAt?: string | null;
    movementHasRealTime?: number | boolean | null;
    movementDateTimeSource?: string | null;
    invoiceDate?: string | null;
    invoiceCreatedAt?: string | null;
    invoiceHasRealTime?: number | boolean | null;
    invoiceDateTimeSource?: string | null;
    amount?: number | null;
    paymentMethod?: string | null;
    accountNo?: number | string | null;
    accountName?: string | null;
    customerId?: number | string | null;
    customerName?: string | null;
    sellerName?: string | null;
  } | null;
  invoiceLines?: unknown[];
  linkedPayments?: unknown[];
}

export interface TradingProfitResponse {
  success: boolean;
  profile?: string | null | undefined;
  dateFrom?: string;
  dateTo?: string;
  summary?: TradingProfitSummary;
  officialSummary?: TradingProfitSummary;
  actualRevenue?: {
    netRevenue?: number | null;
    movementCount?: number | null;
    cashSalesTotal?: number | null;
    debtorPaymentsTotal?: number | null;
    returnsTotal?: number | null;
    electronicPaymentsTotal?: number | null;
    sourceTable?: string | null;
  };
  reconciliation?: {
    officialRevenue?: number | null;
    actualRevenue?: number | null;
    shortfall?: number | null;
    isSnapshotIncomplete?: boolean | null;
    source?: string | null;
  };
  staleSource?: {
    isStale?: boolean | null;
    isMissingOfficial?: boolean | null;
    isDifferent?: boolean | null;
    officialRevenue?: number | null;
    actualNetRevenue?: number | null;
    revenueDifference?: number | null;
    message?: string | null;
  };
  movements?: TradingProfitMovement[];
  actualMovements?: TradingProfitMovement[];
  profit?: number;
  margin?: number;
}

export interface TradingProfitSummary {
  revenue?: number | null;
  costOfGoods?: number | null;
  grossProfit?: number | null;
  supplierPayments?: number | null;
  expenses?: number | null;
  netProfit?: number | null;
  liveRowCount?: number | null;
  sourceTable?: string | null;
}

export interface TradingProfitMovement {
  date?: string | null;
  kind?: string | null;
  description?: string | null;
  tradingUser?: string | null;
  amount?: number | null;
  profit?: number | null;
  cost?: number | null;
  refreshProfit?: number | null;
  referenceNo?: number | string | null;
  sourceTable?: string | null;
  movementNo?: number | string | null;
  invoiceNo?: number | string | null;
  customerName?: string | null;
  sellerName?: string | null;
  paymentMethod?: string | null;
  revenueSource?: string | null;
  accountNo?: number | string | null;
}

export interface AnalyticsProfitItemRow {
  itemId: number | string;
  itemName: string;
  quantity?: number | null;
  salesValue?: number | null;
  approximateProfit?: number | null;
}

export interface AnalyticsDailyProfitResponse {
  success: boolean;
  profile?: string | null | undefined;
  dateFrom?: string | null;
  dateTo?: string | null;
  revenue?: RevenueSummary;
  tradingProfit?: TradingProfitSummary;
  bestProfitItems?: AnalyticsProfitItemRow[];
  worstProfitItems?: AnalyticsProfitItemRow[];
  mostSoldItems?: AnalyticsProfitItemRow[];
}

export interface AnalyticsSearchRow {
  resultType: string;
  id: string | number;
  title: string;
  subtitle?: string | null;
  targetType: "item" | "customer" | "supplier" | "sales-invoice" | "purchase-invoice" | "revenue-movement" | string;
  targetId: string | number;
}

export interface AnalyticsSearchResponse {
  success?: boolean;
  profile?: string | null | undefined;
  query: string;
  rows: AnalyticsSearchRow[];
}

export interface AnalyticsComparePeriod {
  dateFrom: string;
  dateTo: string;
  revenue?: RevenueSummary;
  profit?: TradingProfitSummary;
}

export interface AnalyticsComparePeriodsResponse {
  success: boolean;
  profile?: string | null | undefined;
  left: AnalyticsComparePeriod;
  right: AnalyticsComparePeriod;
}

export interface AnalyticsPriceChangeRow {
  itemId: number | string;
  itemName: string;
  barcode?: string | null;
  previousPurchasePrice?: number | null;
  latestPurchasePrice?: number | null;
  difference?: number | null;
  percentChange?: number | null;
  previousPriceDate?: string | null;
  latestPriceDate?: string | null;
  previousDate?: string | null;
  latestDate?: string | null;
  previousMovementNo?: number | string | null;
  latestMovementNo?: number | string | null;
  previousInvoiceNo?: number | string | null;
  latestInvoiceNo?: number | string | null;
  previousSupplierId?: number | string | null;
  previousSupplierName?: string | null;
  latestSupplierId?: number | string | null;
  latestSupplierName?: string | null;
  supplierName?: string | null;
  previousBarcode?: string | null;
  latestBarcode?: string | null;
  unitName?: string | null;
  previousUnitName?: string | null;
  latestUnitName?: string | null;
  previousUnitOldQuantity?: number | null;
  latestUnitOldQuantity?: number | null;
  previousRawQuantity?: number | null;
  latestRawQuantity?: number | null;
  previousBusinessQuantity?: number | null;
  latestBusinessQuantity?: number | null;
  previousItemCost?: number | null;
  latestItemCost?: number | null;
  previousLineTotal?: number | null;
  latestLineTotal?: number | null;
  status?: "valid" | "unit_mismatch_risk" | "opening_balance_risk" | "data_anomaly" | string;
  statusReason?: string | null;
}

export interface AnalyticsPriceChangesResponse {
  success: boolean;
  profile?: string | null | undefined;
  rows: AnalyticsPriceChangeRow[];
  totalCount?: number | null;
  page?: number | null;
  pageSize?: number | null;
  sort?: string | null;
  status?: string | null;
  summary?: {
    totalCandidateItems?: number | null;
    trustedValidChanges?: number | null;
    reviewRows?: number | null;
    unitMismatchRisk?: number | null;
    openingBalanceRisk?: number | null;
    dataAnomaly?: number | null;
    significantValidCount?: number | null;
  };
}

export interface AnalyticsAlertRow {
  severity: "high" | "medium" | "low" | string;
  title: string;
  value?: number | null;
  message?: string | null;
}

export interface AnalyticsAlertsResponse {
  success: boolean;
  profile?: string | null | undefined;
  rows: AnalyticsAlertRow[];
}

export interface AnalyticsItemProfitResponse {
  success: boolean;
  profile?: string | null | undefined;
  item?: ItemInfo | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  summary?: {
    totalPurchasedQuantity?: number | null;
    totalSoldQuantity?: number | null;
    remainingQuantity?: number | null;
    costOfGoodsSold?: number | null;
    totalSalesValue?: number | null;
    totalApproximateProfit?: number | null;
    profitMarginPercent?: number | null;
  };
  suppliers?: {
    name: string;
    quantity?: number | null;
    total?: number | null;
    lastPurchaseDate?: string | null;
  }[];
  customers?: {
    name: string;
    quantity?: number | null;
    total?: number | null;
    lastSaleDate?: string | null;
  }[];
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

export interface InventorySummaryResponse {
  success: boolean;
  outOfStockCount: number;
  lowStockCount: number;
  expiryCount: number;
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
  profile?: string | null | undefined;
  customers?: AccountPerson[];
  suppliers?: AccountPerson[];
}

export interface CustomerDetailsResponse {
  success: boolean;
  profile?: string | null | undefined;
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
  profile?: string | null | undefined;
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
  profile?: string | null | undefined;
  header: InvoiceHeader;
  items: InvoiceItemRow[];
}

export interface ReportInvoiceRow {
  rowNo?: number | null;
  date: string;
  movementNo: number | string;
  invoiceNo?: number | string | null;
  personName?: string | null;
  movementType?: string | null;
  itemCount?: number | null;
  total: number;
  accountNo?: number | string | null;
}

export interface ReportPaymentRow {
  rowNo?: number | null;
  date: string;
  personName?: string | null;
  amount: number;
  paymentMethod?: string | null;
  paymentNo: number | string;
  movementNo?: number | string | null;
  notes?: string | null;
  personLabel?: string | null;
}

export interface ReportSummary {
  movementCount: number;
  totalAmount: number;
  averageAmount?: number | null;
}

export interface PagedReportResponse<T> {
  success: boolean;
  profile?: string | null | undefined;
  page?: number | null;
  pageSize?: number | null;
  rows: T[];
  summary: ReportSummary;
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

export function getRevenueMovementDetails(movementNo: string | number): Promise<RevenueMovementDetailsResponse> {
  return apiRequest<RevenueMovementDetailsResponse>(API_ENDPOINTS.revenueMovementDetails(movementNo));
}

export function getTradingProfit(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<TradingProfitResponse> {
  return apiRequest<TradingProfitResponse>(API_ENDPOINTS.tradingProfit(), { query: params });
}

export function getAnalyticsDailyProfit(params: {
  dateFrom: string;
  dateTo: string;
}): Promise<AnalyticsDailyProfitResponse> {
  return apiRequest<AnalyticsDailyProfitResponse>(API_ENDPOINTS.analyticsDailyProfit(), { query: params });
}

export function getAnalyticsGlobalSearch(q: string): Promise<AnalyticsSearchResponse> {
  return apiRequest<AnalyticsSearchResponse>(API_ENDPOINTS.analyticsGlobalSearch(), { query: { q } });
}

export function getAnalyticsComparePeriods(params: {
  leftFrom: string;
  leftTo: string;
  rightFrom: string;
  rightTo: string;
}): Promise<AnalyticsComparePeriodsResponse> {
  return apiRequest<AnalyticsComparePeriodsResponse>(API_ENDPOINTS.analyticsComparePeriods(), { query: params });
}

export function getAnalyticsPriceChanges(params: {
  page?: number;
  pageSize?: number;
  sort?: "latest" | "largest-increase" | "largest-decrease" | "largest-change";
  status?: "valid" | "review" | "all" | "unit_mismatch_risk" | "opening_balance_risk" | "data_anomaly";
} = {}): Promise<AnalyticsPriceChangesResponse> {
  return apiRequest<AnalyticsPriceChangesResponse>(API_ENDPOINTS.analyticsPriceChanges(), { query: params });
}

export function getAnalyticsAlerts(): Promise<AnalyticsAlertsResponse> {
  return apiRequest<AnalyticsAlertsResponse>(API_ENDPOINTS.analyticsAlerts());
}

export function getAnalyticsItemProfit(params: {
  itemId: string | number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AnalyticsItemProfitResponse> {
  return apiRequest<AnalyticsItemProfitResponse>(API_ENDPOINTS.analyticsItemProfit(), { query: params });
}

// TODO: Single-item analytical drill-down can later use /api/analytics/item-profit?itemId=...
// analyticsItemProfit ultimately depends on trackItem TOP (500), so historical
// ranges for very high-movement items may be incomplete.

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

export function getSalesReport(params: {
  dateFrom: string;
  dateTo: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedReportResponse<ReportInvoiceRow>> {
  return apiRequest<PagedReportResponse<ReportInvoiceRow>>(API_ENDPOINTS.reportSales(), { query: params });
}

export function getPurchasesReport(params: {
  dateFrom: string;
  dateTo: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedReportResponse<ReportInvoiceRow>> {
  return apiRequest<PagedReportResponse<ReportInvoiceRow>>(API_ENDPOINTS.reportPurchases(), { query: params });
}

export function getReturnsReport(params: {
  type: "sales" | "purchase";
  dateFrom: string;
  dateTo: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedReportResponse<ReportInvoiceRow>> {
  return apiRequest<PagedReportResponse<ReportInvoiceRow>>(API_ENDPOINTS.reportReturns(), { query: params });
}

export function getCustomerReceiptsReport(params: {
  dateFrom: string;
  dateTo: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedReportResponse<ReportPaymentRow>> {
  return apiRequest<PagedReportResponse<ReportPaymentRow>>(API_ENDPOINTS.reportCustomerReceipts(), { query: params });
}

export function getSupplierPaymentsReport(params: {
  dateFrom: string;
  dateTo: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedReportResponse<ReportPaymentRow>> {
  return apiRequest<PagedReportResponse<ReportPaymentRow>>(API_ENDPOINTS.reportSupplierPayments(), { query: params });
}

export function getOutOfStock(): Promise<StockInfoResponse> {
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsOutOfStock(), { query: { page: 1, pageSize: 1 } })
    .then((response) => ({ success: response.success, count: response.totalCount ?? response.rows?.length ?? 0 }));
}

export function getLowStock(): Promise<StockInfoResponse> {
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsStock(), { query: { availableOnly: true, page: 1, pageSize: 1 } })
    .then((response) => ({ success: response.success, count: response.totalCount ?? response.rows?.length ?? 0 }));
}

export function getExpiryItems(): Promise<StockInfoResponse> {
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsExpiry(), { query: { days: 90, page: 1, pageSize: 1 } })
    .then((response) => ({ success: response.success, count: response.totalCount ?? response.rows?.length ?? 0 }));
}

export function getInventorySummary(): Promise<InventorySummaryResponse> {
  return apiRequest<InventorySummaryResponse>(API_ENDPOINTS.itemsSummary());
}

export interface ItemInfo {
  id: number | string;
  name: string;
  code?: string | number | null;
  barcode?: string | null;
  quantity?: number | null;
  rawQuantity?: number | null;
  packageQuantity?: number | null;
  remainingUnits?: number | null;
  packSize?: number | null;
  unitName?: string | null;
  formattedQuantity?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  expiryDate?: string | null;
  expiryStatus?: "valid" | "near" | "expired" | null;
  batch?: string | null;
  daysRemaining?: number | null;
  lastSaleDate?: string | null;
  lastPurchaseDate?: string | null;
  lastSupplier?: string | null;
}

export interface InventoryResponse {
  success: boolean;
  profile?: string | null | undefined;
  rows: ItemInfo[];
  totalCount?: number | null;
  page?: number | null;
  pageSize?: number | null;
  hasMore?: boolean;
}

export interface ItemMovement {
  date: string;
  type: "purchase" | "sales" | "return-sales" | "return-purchase" | "transfer" | "adjustment" | string;
  movementNo: string | number;
  invoiceNo?: string | number | null;
  sideName: string; // Supplier or Customer
  inQty?: number | null;
  outQty?: number | null;
  quantity?: number | null;
  rawQuantity?: number | null;
  businessQuantity?: number | null;
  unitName?: string | null;
  unitOldQuantity?: number | null;
  businessUnitPrice?: number | null;
  formattedQuantity?: string | null;
  price: number | null;
  total: number | null;
  itemCost?: number | null;
  movementGroup?: string | null;
}

export interface ItemTrackingSummary {
  currentStock: number | null;
  formattedStock?: string | null;
  totalIn: number | null;
  totalOut: number | null;
  salesReturns: number | null;
  purchaseReturns: number | null;
  lastPurchasePrice: number | null;
  lastSalePrice: number | null;
  approximateProfit?: number | null;
  lastPurchaseDate?: string | null;
  lastSaleDate?: string | null;
}

export interface ItemTrackingResponse {
  success: boolean;
  profile?: string | null | undefined;
  item?: ItemInfo | null;
  summary: ItemTrackingSummary;
  purchases: ItemMovement[];
  sales: ItemMovement[];
  suppliers: {
    name: string;
    count: number | null;
    totalQty: number | null;
    quantity?: string | null;
    lastPurchaseDate: string | null;
    lastPurchasePrice: number | null;
    total?: number | null;
  }[];
  customers: {
    name: string;
    count: number | null;
    totalQty: number | null;
    quantity?: string | null;
    lastSaleDate: string | null;
    lastSalePrice: number | null;
    total?: number | null;
  }[];
  movements: ItemMovement[];
}

type BackendItemRow = {
  itemCode?: number | string | null;
  itemId?: number | string | null;
  itemName?: string | null;
  barcode?: string | number | null;
  currentQuantity?: number | null;
  currentStock?: number | null;
  quantity?: number | null;
  rawQuantityInSmallUnits?: number | null;
  packageQuantity?: number | null;
  remainingUnits?: number | null;
  packSize?: number | null;
  unitName?: string | null;
  formattedQuantity?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  expiryDate?: string | null;
  batch?: string | null;
  daysRemaining?: number | null;
  lastSaleDate?: string | null;
  lastPurchaseDate?: string | null;
  lastSupplier?: string | null;
};

type BackendRowsResponse<T> = {
  success: boolean;
  profile?: string;
  rows?: T[];
  totalCount?: number | null;
  page?: number | null;
  pageSize?: number | null;
  hasMore?: boolean;
  bucket?: string | null;
  days?: number | null;
};

type BackendTrackMovement = {
  date?: string | null;
  movementType?: string | null;
  movementNo?: number | string | null;
  invoiceNo?: number | string | null;
  personName?: string | null;
  quantity?: number | null;
  rawQuantity?: number | null;
  businessQuantity?: number | null;
  unitName?: string | null;
  unitOldQuantity?: number | null;
  businessUnitPrice?: number | null;
  price?: number | null;
  total?: number | null;
  itemCost?: number | null;
  movementGroup?: string | null;
};

type BackendPartyRow = {
  name?: string | null;
  movementCount?: number | null;
  quantity?: number | null;
  total?: number | null;
  lastPurchaseDate?: string | null;
  lastSaleDate?: string | null;
};

type BackendTrackResponse = {
  success: boolean;
  profile?: string;
  item?: BackendItemRow | null;
  summary?: {
    quantityIn?: number | null;
    quantityOut?: number | null;
    salesReturns?: number | null;
    purchaseReturns?: number | null;
    approximateProfit?: number | null;
    lastPurchaseDate?: string | null;
    lastSaleDate?: string | null;
  };
  movements?: BackendTrackMovement[];
  suppliers?: BackendPartyRow[];
  customers?: BackendPartyRow[];
};

function numberOrNull(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function compactQuantity(parts: { packages?: number | null | undefined; units?: number | null | undefined; packSize?: number | null | undefined; raw?: number | null | undefined }) {
  const packages = numberOrNull(parts.packages) ?? 0;
  const units = numberOrNull(parts.units) ?? 0;
  const packSize = numberOrNull(parts.packSize) ?? 1;
  const raw = numberOrNull(parts.raw) ?? 0;

  if (packSize > 1) {
    const textParts: string[] = [];
    if (packages !== 0) textParts.push(`${formatPlainNumber(packages)} علبة`);
    if (units !== 0) textParts.push(`${formatPlainNumber(units)} وحدة`);
    return textParts.length ? textParts.join(" + ") : "0 وحدة";
  }

  return `${formatPlainNumber(raw)} وحدة`;
}

function formatPlainNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
}

function formatBackendQuantity(row: BackendItemRow, quantityKey: "currentQuantity" | "currentStock" | "quantity" = "currentQuantity") {
  if (row.formattedQuantity) return row.formattedQuantity;
  const raw = numberOrNull(row.rawQuantityInSmallUnits ?? row[quantityKey]);
  return compactQuantity({
    raw,
    packSize: row.packSize,
    packages: row.packageQuantity,
    units: row.remainingUnits,
  });
}

function mapItem(row: BackendItemRow, quantityKey: "currentQuantity" | "currentStock" | "quantity" = "currentQuantity"): ItemInfo {
  const rawQuantity = numberOrNull(row.rawQuantityInSmallUnits ?? row[quantityKey]);
  return {
    id: row.itemId ?? row.itemCode ?? "",
    code: row.itemCode ?? row.itemId ?? null,
    name: row.itemName || "-",
    barcode: row.barcode == null ? null : String(row.barcode),
    quantity: numberOrNull(row[quantityKey] ?? row.currentQuantity ?? row.currentStock ?? row.quantity),
    rawQuantity,
    packageQuantity: numberOrNull(row.packageQuantity),
    remainingUnits: numberOrNull(row.remainingUnits),
    packSize: numberOrNull(row.packSize),
    unitName: row.unitName ?? null,
    formattedQuantity: formatBackendQuantity(row, quantityKey) || null,
    purchasePrice: numberOrNull(row.purchasePrice),
    salePrice: numberOrNull(row.salePrice),
    expiryDate: row.expiryDate ?? null,
    expiryStatus: expiryStatus(row.expiryDate, row.daysRemaining) || null,
    batch: row.batch ?? null,
    daysRemaining: numberOrNull(row.daysRemaining),
    lastSaleDate: row.lastSaleDate ?? null,
    lastPurchaseDate: row.lastPurchaseDate ?? null,
    lastSupplier: row.lastSupplier ?? null,
  };
}

function expiryStatus(expiryDate?: string | null, daysRemaining?: number | null): ItemInfo["expiryStatus"] {
  if (!expiryDate && daysRemaining == null) return null;
  const days = numberOrNull(daysRemaining);
  if (days != null) {
    if (days < 0) return "expired";
    if (days <= 90) return "near";
    return "valid";
  }
  const date = expiryDate ? new Date(expiryDate) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "near";
  return "valid";
}

function formatMovementQuantity(rawQuantity: number | null, packSize?: number | null) {
  const absoluteRaw = Math.abs(rawQuantity ?? 0);
  const safePackSize = numberOrNull(packSize) ?? 1;
  if (safePackSize > 1) {
    const packages = Math.floor(absoluteRaw / safePackSize);
    const units = absoluteRaw - packages * safePackSize;
    return compactQuantity({ raw: absoluteRaw, packSize: safePackSize, packages, units });
  }
  return `${formatPlainNumber(absoluteRaw)} وحدة`;
}

function formatBusinessMovementQuantity(row: BackendTrackMovement, fallbackQuantity: number | null, item?: ItemInfo | null) {
  const businessQuantity = numberOrNull(row.businessQuantity);
  const unitName = row.unitName || null;
  if (businessQuantity != null && businessQuantity > 0 && unitName) {
    return `${formatPlainNumber(businessQuantity)} ${unitName}`;
  }
  const unitOldQuantity = numberOrNull(row.unitOldQuantity);
  const rawQuantity = numberOrNull(row.rawQuantity ?? fallbackQuantity);
  if (unitName && rawQuantity != null && unitOldQuantity != null && unitOldQuantity > 0) {
    return `${formatPlainNumber(Math.abs(rawQuantity) / unitOldQuantity)} ${unitName}`;
  }
  return formatMovementQuantity(fallbackQuantity, item?.packSize);
}

function mapMovement(row: BackendTrackMovement, item?: ItemInfo | null): ItemMovement {
  const rawQuantity = numberOrNull(row.quantity);
  const group = row.movementGroup || "other";
  const sourceRawQuantity = numberOrNull(row.rawQuantity);
  const businessQuantity = numberOrNull(row.businessQuantity);
  return {
    date: row.date || "",
    type: row.movementType || group,
    movementNo: row.movementNo ?? "",
    invoiceNo: row.invoiceNo ?? null,
    sideName: row.personName || "-",
    quantity: rawQuantity,
    rawQuantity: sourceRawQuantity,
    businessQuantity,
    unitName: row.unitName ?? null,
    unitOldQuantity: numberOrNull(row.unitOldQuantity),
    businessUnitPrice: numberOrNull(row.businessUnitPrice),
    inQty: rawQuantity != null && rawQuantity > 0 ? rawQuantity : null,
    outQty: rawQuantity != null && rawQuantity < 0 ? Math.abs(rawQuantity) : null,
    formattedQuantity: formatBusinessMovementQuantity(row, rawQuantity, item),
    price: numberOrNull(row.price),
    total: numberOrNull(row.total),
    itemCost: numberOrNull(row.itemCost),
    movementGroup: group,
  };
}

function mapParty(row: BackendPartyRow, item?: ItemInfo | null) {
  const quantity = numberOrNull(row.quantity);
  return {
    name: row.name || "-",
    count: numberOrNull(row.movementCount),
    totalQty: quantity,
    quantity: formatMovementQuantity(quantity, item?.packSize),
    lastPurchaseDate: row.lastPurchaseDate ?? null,
    lastSaleDate: row.lastSaleDate ?? null,
    lastPurchasePrice: null,
    lastSalePrice: null,
    total: numberOrNull(row.total),
  };
}

function mapInventoryRows(response: BackendRowsResponse<BackendItemRow>, quantityKey?: "currentQuantity" | "quantity"): InventoryResponse {
  return {
    success: response.success,
    profile: response.profile || undefined,
    rows: (response.rows || []).map((row) => mapItem(row, quantityKey || "currentQuantity")),
    totalCount: numberOrNull(response.totalCount),
    page: numberOrNull(response.page),
    pageSize: numberOrNull(response.pageSize),
    hasMore: Boolean(response.hasMore),
  };
}

export function getInventory(params: {
  search?: string;
  filter?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
  limit?: string | number;
}): Promise<InventoryResponse> {
  if (params.filter === "out-of-stock") {
    return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsOutOfStock(), {
      query: { search: params.search, sort: params.sortBy, page: params.page, pageSize: params.pageSize, limit: params.limit },
    }).then((response) => mapInventoryRows(response));
  }

  if (params.filter?.startsWith("expiry-")) {
    const expiryFilter = params.filter.replace("expiry-", "");
    const query = /^\d+$/.test(expiryFilter)
      ? { search: params.search, days: expiryFilter, page: params.page, pageSize: params.pageSize, limit: params.limit }
      : { search: params.search, bucket: expiryFilter, page: params.page, pageSize: params.pageSize, limit: params.limit };
    return apiRequest<BackendRowsResponse<BackendItemRow> & { days?: number }>(API_ENDPOINTS.itemsExpiry(), {
      query,
    }).then((response) => mapInventoryRows(response, "quantity"));
  }

  const query: Record<string, string | number | boolean | undefined> = {
    search: params.search,
    sort: params.sortBy,
    page: params.page,
    pageSize: params.pageSize,
    limit: params.limit,
  };

  if (params.filter === "available") query["availableOnly"] = true;
  if (params.filter === "near-expiry") {
    return apiRequest<BackendRowsResponse<BackendItemRow> & { days?: number }>(API_ENDPOINTS.itemsExpiry(), {
      query: { search: params.search, days: 90, page: params.page, pageSize: params.pageSize, limit: params.limit },
    }).then((response) => mapInventoryRows(response, "quantity"));
  }

  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsStock(), { query }).then((response) => mapInventoryRows(response));
}

export function getItemTracking(id: string | number): Promise<ItemTrackingResponse> {
  return apiRequest<BackendTrackResponse>(API_ENDPOINTS.itemsTrack(), { query: { itemId: id } }).then((response) => {
    const item = response.item ? mapItem(response.item, "currentStock") : null;
    const movements = (response.movements || []).map((row) => mapMovement(row, item));
    const purchases = movements.filter((row) => row.movementGroup === "purchase");
    const sales = movements.filter((row) => row.movementGroup === "sale");
    return {
      success: response.success,
      profile: response.profile || undefined,
      item,
      summary: {
        currentStock: item?.rawQuantity ?? null,
        formattedStock: item?.formattedQuantity ?? null,
        totalIn: numberOrNull(response.summary?.quantityIn),
        totalOut: numberOrNull(response.summary?.quantityOut),
        salesReturns: numberOrNull(response.summary?.salesReturns),
        purchaseReturns: numberOrNull(response.summary?.purchaseReturns),
        lastPurchasePrice: item?.purchasePrice ?? null,
        lastSalePrice: item?.salePrice ?? null,
        approximateProfit: numberOrNull(response.summary?.approximateProfit),
        lastPurchaseDate: response.summary?.lastPurchaseDate ?? null,
        lastSaleDate: response.summary?.lastSaleDate ?? null,
      },
      purchases,
      sales,
      suppliers: (response.suppliers || []).map((row) => ({ ...mapParty(row, item), total: numberOrNull(row.total) || null })),
      customers: (response.customers || []).map((row) => ({ ...mapParty(row, item), total: numberOrNull(row.total) || null })),
      movements,
    };
  });
}

