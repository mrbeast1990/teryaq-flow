import { existsSync } from "node:fs";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHmac, randomBytes, randomUUID } from "node:crypto";

export type CompanyPaymentType = "cash" | "bank";
export type CompanyPaymentStatus = "pending" | "deducted";

export type CompanyRecord = {
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
  storageName: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type CompanyPaymentRecord = {
  id: string;
  companyId: string;
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

export type PaymentRow = CompanyPaymentRecord & {
  companyName: string;
  representativeName: string;
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

type DatabaseShape = {
  companies: CompanyRecord[];
  payments: CompanyPaymentRecord[];
};

const DATA_DIR = path.join(process.cwd(), ".data", "company-payments");
const ATTACHMENTS_DIR = path.join(DATA_DIR, "attachments");
const COMPANIES_FILE = path.join(DATA_DIR, "companies.json");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const MAX_PAGE_SIZE = 100;
const SIGNING_SECRET = randomBytes(32).toString("hex");
const PAYMENT_OPERATORS = new Set(["المدير", "عبدالوهاب"]);
let writeQueue = Promise.resolve();

function now() {
  return new Date().toISOString();
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeName(value: unknown) {
  return normalizeText(value).replace(/\s+/g, " ").toLocaleLowerCase("ar");
}

function parsePositiveAmount(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("المبلغ يجب أن يكون أكبر من صفر.");
  }
  return Math.round(amount * 1000) / 1000;
}

function parseDate(value: unknown) {
  const text = normalizeText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error("التاريخ غير صحيح.");
  }
  return text;
}

function paymentOperator(value: unknown, fallback: string) {
  const text = normalizeText(value);
  return PAYMENT_OPERATORS.has(text) ? text : fallback;
}

function safePage(value: unknown) {
  const page = Math.max(1, Number(value || 1));
  return Number.isFinite(page) ? Math.floor(page) : 1;
}

function safePageSize(value: unknown) {
  const pageSize = Math.max(1, Number(value || 25));
  return Number.isFinite(pageSize) ? Math.min(MAX_PAGE_SIZE, Math.floor(pageSize)) : 25;
}

async function ensureStore() {
  await mkdir(ATTACHMENTS_DIR, { recursive: true });
  if (!existsSync(COMPANIES_FILE)) await writeFile(COMPANIES_FILE, "[]", "utf8");
  if (!existsSync(PAYMENTS_FILE)) await writeFile(PAYMENTS_FILE, "[]", "utf8");
}

async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  await ensureStore();
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function readDb(): Promise<DatabaseShape> {
  const [companies, payments] = await Promise.all([
    readJsonFile<CompanyRecord[]>(COMPANIES_FILE, []),
    readJsonFile<CompanyPaymentRecord[]>(PAYMENTS_FILE, []),
  ]);
  return { companies, payments };
}

async function writeDb(db: DatabaseShape) {
  await ensureStore();
  writeQueue = writeQueue.then(async () => {
    await writeFile(`${COMPANIES_FILE}.tmp`, JSON.stringify(db.companies, null, 2), "utf8");
    await rename(`${COMPANIES_FILE}.tmp`, COMPANIES_FILE);
    await writeFile(`${PAYMENTS_FILE}.tmp`, JSON.stringify(db.payments, null, 2), "utf8");
    await rename(`${PAYMENTS_FILE}.tmp`, PAYMENTS_FILE);
  });
  await writeQueue;
}

function joinPayment(payment: CompanyPaymentRecord, companies: CompanyRecord[]): PaymentRow {
  const company = companies.find((item) => item.id === payment.companyId);
  return {
    ...payment,
    companyName: company?.name || "شركة غير معروفة",
    representativeName: company?.representativeName || "",
  };
}

function filterPaymentRows(rows: PaymentRow[], filters: PaymentFilters) {
  const search = normalizeName(filters.search);
  return rows.filter((row) => {
    if (filters.companyId && row.companyId !== filters.companyId) return false;
    if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.dateFrom && row.date < filters.dateFrom) return false;
    if (filters.dateTo && row.date > filters.dateTo) return false;
    if (!search) return true;
    const haystack = normalizeName(
      [row.companyName, row.representativeName, row.notes, row.referenceNo, row.createdBy, row.deductedBy].join(" "),
    );
    return haystack.includes(search);
  });
}

export async function listCompanies(search?: string) {
  const db = await readDb();
  const term = normalizeName(search);
  const rows = db.companies
    .filter((company) => {
      if (!term) return true;
      return normalizeName([company.name, company.representativeName, company.phone].join(" ")).includes(term);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return { rows, totalCount: rows.length };
}

export async function createCompany(input: Partial<CompanyRecord>, user: string) {
  const name = normalizeText(input.name);
  if (!name) throw new Error("اسم الشركة إلزامي.");
  const db = await readDb();
  if (db.companies.some((company) => normalizeName(company.name) === normalizeName(name))) {
    throw new Error("اسم الشركة موجود مسبقًا.");
  }
  const timestamp = now();
  const company: CompanyRecord = {
    id: randomUUID(),
    name,
    representativeName: normalizeText(input.representativeName),
    phone: normalizeText(input.phone),
    bankAccount: normalizeText(input.bankAccount),
    createdBy: user,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.companies.push(company);
  await writeDb(db);
  return company;
}

export async function updateCompany(input: Partial<CompanyRecord>, user: string) {
  const id = normalizeText(input.id);
  const name = normalizeText(input.name);
  if (!id) throw new Error("الشركة غير محددة.");
  if (!name) throw new Error("اسم الشركة إلزامي.");
  const db = await readDb();
  const company = db.companies.find((item) => item.id === id);
  if (!company) throw new Error("الشركة غير موجودة.");
  if (db.companies.some((item) => item.id !== id && normalizeName(item.name) === normalizeName(name))) {
    throw new Error("اسم الشركة موجود مسبقًا.");
  }
  company.name = name;
  company.representativeName = normalizeText(input.representativeName);
  company.phone = normalizeText(input.phone);
  company.bankAccount = normalizeText(input.bankAccount);
  company.updatedAt = now();
  company.createdBy = company.createdBy || user;
  await writeDb(db);
  return company;
}

export async function listPayments(filters: PaymentFilters) {
  const db = await readDb();
  const page = safePage(filters.page);
  const pageSize = safePageSize(filters.pageSize);
  const allRows = db.payments.map((payment) => joinPayment(payment, db.companies));
  const filtered = filterPaymentRows(allRows, filters).sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const totalAmount = filtered.reduce((sum, row) => sum + row.amount, 0);
  const pendingAmount = filtered.filter((row) => row.status === "pending").reduce((sum, row) => sum + row.amount, 0);
  return {
    rows,
    totalCount: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
    summary: {
      totalAmount,
      pendingAmount,
      pendingCount: filtered.filter((row) => row.status === "pending").length,
      companyCount: new Set(filtered.map((row) => row.companyId)).size,
    },
  };
}

export async function listPaymentsForExport(filters: PaymentFilters) {
  const db = await readDb();
  const allRows = db.payments.map((payment) => joinPayment(payment, db.companies));
  return filterPaymentRows(allRows, filters).sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function createPayment(input: Partial<CompanyPaymentRecord>, user: string) {
  const db = await readDb();
  const companyId = normalizeText(input.companyId);
  if (!db.companies.some((company) => company.id === companyId)) throw new Error("الشركة إلزامية.");
  const timestamp = now();
  const payment: CompanyPaymentRecord = {
    id: randomUUID(),
    companyId,
    amount: parsePositiveAmount(input.amount),
    date: parseDate(input.date),
    type: input.type === "bank" ? "bank" : "cash",
    notes: normalizeText(input.notes),
    referenceNo: normalizeText(input.referenceNo),
    status: "pending",
    createdBy: paymentOperator(input.createdBy, user),
    createdAt: timestamp,
    updatedAt: timestamp,
    deductedBy: null,
    deductedAt: null,
    attachment: null,
  };
  db.payments.push(payment);
  await writeDb(db);
  return joinPayment(payment, db.companies);
}

export async function updatePayment(input: Partial<CompanyPaymentRecord>, user: string) {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === normalizeText(input.id));
  if (!payment) throw new Error("السداد غير موجود.");
  payment.amount = parsePositiveAmount(input.amount);
  payment.date = parseDate(input.date);
  payment.type = input.type === "bank" ? "bank" : "cash";
  payment.notes = normalizeText(input.notes);
  payment.referenceNo = normalizeText(input.referenceNo);
  payment.updatedAt = now();
  payment.createdBy = paymentOperator(input.createdBy, payment.createdBy || user);
  await writeDb(db);
  return joinPayment(payment, db.companies);
}

export async function deletePayment(id: string) {
  const db = await readDb();
  const index = db.payments.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("السداد غير موجود.");
  const [payment] = db.payments.splice(index, 1);
  if (payment.attachment) {
    await unlink(path.join(ATTACHMENTS_DIR, payment.attachment.storageName)).catch(() => undefined);
  }
  await writeDb(db);
  return { ok: true };
}

export async function setPaymentDeducted(id: string, deducted: boolean, user: string, deductedBy?: unknown) {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === id);
  if (!payment) throw new Error("السداد غير موجود.");
  payment.status = deducted ? "deducted" : "pending";
  payment.deductedAt = deducted ? now() : null;
  payment.deductedBy = deducted ? paymentOperator(deductedBy, user) : null;
  payment.updatedAt = now();
  await writeDb(db);
  return joinPayment(payment, db.companies);
}

export async function saveAttachment(paymentId: string, file: File, user: string) {
  return saveAttachmentBytes(
    paymentId,
    {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      bytes: Buffer.from(await file.arrayBuffer()),
    },
    user,
  );
}

export async function saveAttachmentBytes(
  paymentId: string,
  file: { fileName: string; mimeType: string; size: number; bytes: Uint8Array },
  user: string,
) {
  const allowed = new Set(["image/jpeg", "image/png", "application/pdf"]);
  if (!allowed.has(file.mimeType)) throw new Error("نوع المرفق غير مدعوم.");
  if (file.size > 8 * 1024 * 1024) throw new Error("حجم المرفق أكبر من المسموح.");
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);
  if (!payment) throw new Error("السداد غير موجود.");
  if (payment.attachment) {
    await unlink(path.join(ATTACHMENTS_DIR, payment.attachment.storageName)).catch(() => undefined);
  }
  await ensureStore();
  const extension = file.mimeType === "application/pdf" ? ".pdf" : file.mimeType === "image/png" ? ".png" : ".jpg";
  const storageName = `${payment.id}-${randomUUID()}${extension}`;
  await writeFile(path.join(ATTACHMENTS_DIR, storageName), file.bytes);
  payment.attachment = {
    id: randomUUID(),
    fileName: normalizeText(file.fileName) || `receipt${extension}`,
    mimeType: file.mimeType,
    size: file.size,
    storageName,
    uploadedBy: user,
    uploadedAt: now(),
  };
  payment.updatedAt = now();
  await writeDb(db);
  return joinPayment(payment, db.companies);
}

export async function deleteAttachment(paymentId: string) {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);
  if (!payment) throw new Error("السداد غير موجود.");
  if (payment.attachment) {
    await unlink(path.join(ATTACHMENTS_DIR, payment.attachment.storageName)).catch(() => undefined);
    payment.attachment = null;
    payment.updatedAt = now();
  }
  await writeDb(db);
  return joinPayment(payment, db.companies);
}

export async function createAttachmentUrl(paymentId: string) {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);
  if (!payment?.attachment) return null;
  const expires = Date.now() + 10 * 60 * 1000;
  const token = createHmac("sha256", SIGNING_SECRET)
    .update(`${payment.id}:${payment.attachment.id}:${expires}`)
    .digest("hex");
  return `/api/company-payments?action=attachment&id=${encodeURIComponent(payment.id)}&expires=${expires}&token=${token}`;
}

export async function readSignedAttachment(paymentId: string, expires: string, token: string) {
  const db = await readDb();
  const payment = db.payments.find((item) => item.id === paymentId);
  if (!payment?.attachment) throw new Error("المرفق غير موجود.");
  if (Number(expires) < Date.now()) throw new Error("انتهت صلاحية الرابط.");
  const expected = createHmac("sha256", SIGNING_SECRET)
    .update(`${payment.id}:${payment.attachment.id}:${expires}`)
    .digest("hex");
  if (token !== expected) throw new Error("رابط المرفق غير صالح.");
  const filePath = path.join(ATTACHMENTS_DIR, payment.attachment.storageName);
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error("المرفق غير موجود.");
  return {
    bytes: await readFile(filePath),
    fileName: payment.attachment.fileName,
    mimeType: payment.attachment.mimeType,
  };
}
