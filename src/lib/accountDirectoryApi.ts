import type { AccountPerson } from "./api";
import type { AccountDirectoryFilters } from "./accountDirectory";

export type DirectoryAccount = AccountPerson & { closed: boolean; revision: number };
export type DirectoryResult = {
  rows: DirectoryAccount[];
  sourceId: string;
  totalCount: number;
  totalBalance: number;
  activeCount: number;
  activeBalance: number;
  closedCount: number;
  closedBalance: number;
  positiveCount: number;
  positiveBalance: number;
  negativeCount: number;
  negativeBalance: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
export async function accountRequest<T>(
  action: string,
  input?: unknown,
  filters?: Partial<AccountDirectoryFilters>,
): Promise<T> {
  const query = new URLSearchParams({ action });
  for (const [key, value] of Object.entries(filters || {}))
    if (value !== undefined) query.set(key, String(value));
  const response = await fetch(`/_flow/accounts?${query}`, {
    method: input === undefined ? "GET" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    ...(input === undefined
      ? {}
      : { headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
  });
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("تعذر قراءة استجابة الحسابات.");
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.message || "تعذر تنفيذ الطلب."), {
      status: response.status,
    });
  return data;
}
export const listAccounts = (filters: AccountDirectoryFilters) =>
  accountRequest<DirectoryResult>("list", undefined, filters);

export async function allFilteredAccounts(filters: AccountDirectoryFilters) {
  const rows: DirectoryAccount[] = [];
  for (let page = 1; ; page++) {
    const result = await listAccounts({ ...filters, page, pageSize: 500 });
    rows.push(...result.rows);
    if (!result.hasMore) return rows;
    if (!result.rows.length) throw new Error("توقفت قراءة الصفحات. أعد المحاولة.");
  }
}
