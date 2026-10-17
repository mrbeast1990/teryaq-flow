import { createHash } from "node:crypto";
import { accountMetadataStore } from "./accountMetadataStore.server";
import { accountMetadataKey, type AccountKind } from "./accountDirectory";

const fail = (message: string, status = 400) => Object.assign(new Error(message), { status });
export function assertAccountMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  let matches = false;
  try {
    matches = Boolean(origin && new URL(origin).host === target.host);
  } catch {
    /* Reject malformed origins. */
  }
  if (!matches || request.headers.get("sec-fetch-site") === "cross-site")
    throw fail("طلب غير مسموح من هذا المصدر.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw fail("نوع الطلب غير صحيح.", 415);
}
async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw fail("الطلب فارغ.");
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 4096) {
      await reader.cancel();
      throw fail("الطلب كبير جدًا.", 413);
    }
    parts.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString("utf8"));
  } catch {
    throw fail("بيانات الطلب غير صحيحة.");
  }
}
async function connector(endpoint: string, query?: URLSearchParams) {
  const origin = new URL(process.env["FLOW_ACCOUNT_CONNECTOR_ORIGIN"] || "http://127.0.0.1:3001");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname))
    throw fail("إعداد الاتصال غير صالح.", 503);
  let response: Response;
  try {
    response = await fetch(new URL(`${endpoint}${query ? `?${query}` : ""}`, origin), {
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });
  } catch {
    throw fail("تعذر الاتصال بمنظومة الحسابات.", 503);
  }
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
    throw fail("تعذر قراءة بيانات الحسابات.", 503);
  const result = await response.json();
  if (result.success !== true) throw fail("تعذر قراءة بيانات الحسابات.", 503);
  return result;
}
async function source() {
  const status = await connector("/api/status");
  if (!status.connected || !status.server || !status.database)
    throw fail("قاعدة بيانات الحسابات غير متصلة.", 503);
  return createHash("sha256")
    .update(
      JSON.stringify([
        String(status.server).trim().toLowerCase(),
        String(status.database).trim().toLowerCase(),
      ]),
    )
    .digest("hex");
}
function kindOf(value: unknown): AccountKind {
  if (value !== "customer" && value !== "supplier") throw fail("نوع الحساب غير صحيح.");
  return value;
}
export async function handleAccountDirectoryRequest(request: Request) {
  const json = (value: unknown, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "list";
    if (request.method === "POST") {
      assertAccountMutationOrigin(request);
      if (action !== "update") throw fail("طلب غير معروف.", 404);
      const input = await body(request);
      const kind = kindOf(input.kind);
      const sourceId = await source();
      if (input.sourceId !== sourceId) throw fail("تغير مصدر البيانات. حدّث الصفحة.", 409);
      accountMetadataKey(sourceId, kind, input.personNo);
      const data = await connector(
        kind === "customer" ? "/api/customers" : "/api/suppliers",
        new URLSearchParams({
          search: String(input.personNo),
          balanceFilter: "all",
          pageSize: "500",
        }),
      );
      const original = data.rows?.find((row: { id: number }) => Number(row.id) === input.personNo);
      if (!original) throw fail("الحساب غير موجود.", 404);
      const saved = await accountMetadataStore.update(
        {
          sourceId,
          kind,
          personNo: input.personNo,
          closed: input.closed,
          phone: input.phone,
          revision: input.revision,
          originalPhone: original.phone,
        },
        "مستخدم Flow",
      );
      return json({ success: true, metadata: saved });
    }
    if (request.method !== "GET" || action !== "list") throw fail("طلب غير مسموح.", 405);
    const kind = kindOf(url.searchParams.get("kind"));
    const sourceId = await source();
    const records = await accountMetadataStore.records(sourceId, kind);
    const query = new URLSearchParams();
    for (const key of [
      "search",
      "balanceFilter",
      "page",
      "pageSize",
      "primarySort",
      "secondarySort",
      "balanceDirection",
      "paymentDirection",
      "paymentFilter",
    ]) {
      const value = url.searchParams.get(key);
      if (value !== null) query.set(key, value);
    }
    const state = url.searchParams.get("state") || "active";
    if (!["active", "closed", "all"].includes(state)) throw fail("فلتر الحالة غير صحيح.");
    const term = (query.get("search") || "").trim().toLowerCase();
    query.set("accountState", state);
    query.set(
      "closedIds",
      records
        .filter((row) => row.closed)
        .map((row) => row.personNo)
        .join(","),
    );
    query.set(
      "phoneMatchIds",
      term
        ? records
            .filter((row) => row.phone?.toLowerCase().includes(term))
            .map((row) => row.personNo)
            .join(",")
        : "",
    );
    const result = await connector(
      kind === "customer" ? "/api/customers" : "/api/suppliers",
      query,
    );
    const metadata = new Map(records.map((row) => [row.personNo, row]));
    const rows = result.rows.map((row: { id: number; phone?: string }) => {
      const saved = metadata.get(Number(row.id));
      return {
        ...row,
        phone: saved?.phone ?? row.phone,
        closed: saved?.closed ?? false,
        revision: saved?.revision ?? 0,
      };
    });
    const { customers: _customers, suppliers: _suppliers, ...safe } = result;
    return json({ ...safe, sourceId, rows });
  } catch (error) {
    const status = Number((error as { status?: number }).status) || 400;
    return json(
      {
        success: false,
        message:
          status >= 500
            ? "تعذر تحميل الحسابات. حاول لاحقًا."
            : error instanceof Error
              ? error.message
              : "تعذر تنفيذ الطلب.",
      },
      status,
    );
  }
}
