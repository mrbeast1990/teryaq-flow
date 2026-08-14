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

export interface RevenueMovementDetailsResponse {
  success: boolean;
  profile?: string;
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
    customerName?: string | null;
    sellerName?: string | null;
  } | null;
  invoiceLines?: unknown[];
  linkedPayments?: unknown[];
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

export function getRevenueMovementDetails(movementNo: string | number): Promise<RevenueMovementDetailsResponse> {
  return apiRequest<RevenueMovementDetailsResponse>(API_ENDPOINTS.revenueMovementDetails(movementNo));
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
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsOutOfStock())
    .then((response) => ({ success: response.success, count: response.rows?.length || 0 }));
}

export function getLowStock(): Promise<StockInfoResponse> {
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsStock(), { query: { availableOnly: true, limit: 500 } })
    .then((response) => ({ success: response.success, count: response.rows?.length || 0 }));
}

export function getExpiryItems(): Promise<StockInfoResponse> {
  return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsExpiry(), { query: { days: 90 } })
    .then((response) => ({ success: response.success, count: response.rows?.length || 0 }));
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
  profile?: string;
  rows: ItemInfo[];
  totalCount?: number | null;
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
  profile?: string;
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
  if (businessQuantity != null && unitName) {
    return `${formatPlainNumber(businessQuantity)} ${unitName}`;
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
  };
}

export function getInventory(params: {
  search?: string;
  filter?: string;
  sortBy?: string;
}): Promise<InventoryResponse> {
  if (params.filter === "out-of-stock") {
    return apiRequest<BackendRowsResponse<BackendItemRow>>(API_ENDPOINTS.itemsOutOfStock(), {
      query: { search: params.search, sort: params.sortBy },
    }).then((response) => mapInventoryRows(response));
  }

  if (params.filter?.startsWith("expiry-")) {
    const expiryFilter = params.filter.replace("expiry-", "");
    const query = /^\d+$/.test(expiryFilter)
      ? { search: params.search, days: expiryFilter }
      : { search: params.search, bucket: expiryFilter };
    return apiRequest<BackendRowsResponse<BackendItemRow> & { days?: number }>(API_ENDPOINTS.itemsExpiry(), {
      query,
    }).then((response) => mapInventoryRows(response, "quantity"));
  }

  const query: Record<string, string | number | boolean | undefined> = {
    search: params.search,
    sort: params.sortBy,
    limit: "all",
  };

  if (params.filter === "available") query["availableOnly"] = true;
  if (params.filter === "near-expiry") {
    return apiRequest<BackendRowsResponse<BackendItemRow> & { days?: number }>(API_ENDPOINTS.itemsExpiry(), {
      query: { search: params.search, days: 90 },
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

