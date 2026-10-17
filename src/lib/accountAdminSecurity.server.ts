import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import {
  readAccountAdminCredential,
  verifyAccountAdminCode,
} from "./accountAdminCredential.server";

const COOKIE = "flow_account_admin";
const SESSION_MS = 30 * 60 * 1000;
const IDLE_MS = 10 * 60 * 1000;
type Session = { expires: number; touched: number; credential: string; changes: number[] };

export function assertAccountMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const target = new URL(request.url);
  if (
    !origin ||
    new URL(origin).host !== target.host ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw Object.assign(new Error("طلب غير مسموح من هذا المصدر."), { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw Object.assign(new Error("نوع الطلب غير صحيح."), { status: 415 });
}

export function createAccountAdminSecurity(
  directory = path.join(process.cwd(), ".data", "account-administration"),
  clock = Date.now,
) {
  const sessions = new Map<string, Session>();
  const failures = new Map<string, { start: number; count: number }>();
  let attempts: number[] = [];
  const digest = (text: string) => createHash("sha256").update(text).digest("hex");
  const readCredential = () => readAccountAdminCredential(path.join(directory, "credential.json"));
  const fingerprint = (credential: { salt: string; key: string }) =>
    digest(`${credential.salt}:${credential.key}`);
  function token(request: Request) {
    const raw = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    return raw && /^[a-f0-9]{64}$/.test(raw) ? digest(raw) : null;
  }
  function cookie(request: Request, value: string, age: number) {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
    return `${COOKIE}=${value}; Path=/_flow/accounts; HttpOnly; SameSite=Strict; Max-Age=${age}${local ? "" : "; Secure"}`;
  }
  async function getSession(request: Request) {
    const key = token(request);
    const current = key ? sessions.get(key) : null;
    const credential = await readCredential();
    if (
      !current ||
      !credential ||
      current.expires <= clock() ||
      current.touched + IDLE_MS <= clock() ||
      current.credential !== fingerprint(credential)
    ) {
      if (key) sessions.delete(key);
      return null;
    }
    current.touched = clock();
    return current;
  }
  return {
    async status(request: Request) {
      const credential = await readCredential();
      const current = await getSession(request);
      return {
        configured: Boolean(credential),
        authenticated: Boolean(current),
        expiresAt: current ? new Date(current.expires).toISOString() : null,
      };
    },
    async login(request: Request, code: unknown) {
      assertAccountMutationOrigin(request);
      const credential = await readCredential();
      if (!credential)
        throw Object.assign(new Error("رمز الإدارة لم يُهيّأ بعد."), { status: 503 });
      const now = clock();
      for (const [key, record] of failures) if (record.start + 900000 <= now) failures.delete(key);
      const ip = request.headers.get("cf-connecting-ip") || "local";
      const failed = failures.get(ip);
      attempts = attempts.filter((time) => time + 60000 > now);
      if ((failed && failed.count >= 5) || attempts.length >= 30 || failures.size >= 1000) {
        throw Object.assign(new Error("محاولات كثيرة. حاول لاحقًا."), { status: 429 });
      }
      attempts.push(now);
      if (!(await verifyAccountAdminCode(code, credential))) {
        failures.set(ip, { start: failed?.start ?? now, count: (failed?.count ?? 0) + 1 });
        throw Object.assign(new Error("تعذر تسجيل الدخول. تحقق من رمز الإدارة."), { status: 401 });
      }
      failures.delete(ip);
      for (const [key, session] of sessions)
        if (session.expires <= now || session.touched + IDLE_MS <= now) sessions.delete(key);
      if (sessions.size >= 100) sessions.delete(sessions.keys().next().value!);
      const raw = randomBytes(32).toString("hex");
      sessions.set(digest(raw), {
        expires: now + SESSION_MS,
        touched: now,
        credential: fingerprint(credential),
        changes: [],
      });
      return { cookie: cookie(request, raw, SESSION_MS / 1000), authenticated: true };
    },
    async authorize(request: Request) {
      assertAccountMutationOrigin(request);
      const current = await getSession(request);
      if (!current)
        throw Object.assign(new Error("يلزم إدخال رمز الإدارة لتعديل الحساب."), { status: 401 });
      current.changes = current.changes.filter((time) => time + 60000 > clock());
      if (current.changes.length >= 60)
        throw Object.assign(new Error("طلبات كثيرة. حاول بعد قليل."), { status: 429 });
      current.changes.push(clock());
      return "إدارة Flow";
    },
    logout(request: Request) {
      assertAccountMutationOrigin(request);
      const key = token(request);
      if (key) sessions.delete(key);
      return cookie(request, "", 0);
    },
  };
}

export const accountAdminSecurity = createAccountAdminSecurity();
