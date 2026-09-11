export type CompanyPaymentType = "cash" | "bank";
export type CompanyPaymentStatus = "pending" | "deducted";

export type Company = {
  id: string;
  name: string;
  representativeName: string;
  phone: string;
  bankAccount: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
};

export type CompanyPayment = {
  id: string;
  companyId: string;
  companyName: string;
  representativeName: string;
  amount: number;
  date: string;
  type: CompanyPaymentType;
  notes: string;
  referenceNo: string;
  status: CompanyPaymentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deductedBy: string | null;
  deductedAt: string | null;
  attachment: PaymentAttachment | null;
};

export type PaymentFilters = {
  companyId?: string;
  status?: "all" | CompanyPaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type PaymentsResponse = {
  rows: CompanyPayment[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  summary: {
    totalAmount: number;
    pendingAmount: number;
    pendingCount: number;
    companyCount: number;
  };
};

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "تعذر تنفيذ الطلب.");
  }
  return response.json() as Promise<T>;
}

export function getCompanies(search?: string) {
  return request<{ rows: Company[]; totalCount: number }>(
    `/api/company-payments?${buildQuery({ action: "companies", search })}`,
  );
}

export function saveCompany(company: Partial<Company>) {
  const action = company.id ? "update-company" : "create-company";
  return request<Company>(`/api/company-payments?action=${action}`, {
    method: "POST",
    body: JSON.stringify(company),
  });
}

export function getCompanyPayments(filters: PaymentFilters) {
  return request<PaymentsResponse>(`/api/company-payments?${buildQuery(filters)}`);
}

export function saveCompanyPayment(payment: Partial<CompanyPayment>) {
  const action = payment.id ? "update-payment" : "create-payment";
  return request<CompanyPayment>(`/api/company-payments?action=${action}`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export function deleteCompanyPayment(id: string) {
  return request<{ ok: boolean }>("/api/company-payments?action=delete-payment", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export function setCompanyPaymentDeducted(id: string, deducted: boolean, deductedBy?: string) {
  return request<CompanyPayment>("/api/company-payments?action=set-deducted", {
    method: "POST",
    body: JSON.stringify({ id, deducted, deductedBy }),
  });
}

export function uploadCompanyPaymentAttachment(paymentId: string, file: File) {
  const formData = new FormData();
  formData.set("paymentId", paymentId);
  formData.set("file", file);
  return request<CompanyPayment>("/api/company-payments?action=upload-attachment", {
    method: "POST",
    body: formData,
  });
}

export function deleteCompanyPaymentAttachment(paymentId: string) {
  return request<CompanyPayment>("/api/company-payments?action=delete-attachment", {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });
}

export function getCompanyPaymentAttachmentUrl(paymentId: string) {
  return request<{ url: string | null }>(
    `/api/company-payments?${buildQuery({ action: "attachment-url", paymentId })}`,
  );
}

export function getCompanyPaymentsExportUrl(filters: PaymentFilters) {
  return `/api/company-payments?${buildQuery({ ...filters, action: "export" })}`;
}
