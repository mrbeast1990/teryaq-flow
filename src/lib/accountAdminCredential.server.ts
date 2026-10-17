import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";

export type AccountAdminCredential = { version: 1; salt: string; key: string; changedAt: string };

async function derive(secret: Uint8Array, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(secret, salt, 32, { N: 16384, r: 8, p: 1 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function createAccountAdminCredential(
  secret: Uint8Array,
): Promise<AccountAdminCredential> {
  if (secret.byteLength < 8 || secret.byteLength > 512)
    throw new Error("رمز الإدارة يجب ألا يقل عن 8 محارف.");
  const salt = randomBytes(16).toString("hex");
  const key = await derive(secret, salt);
  try {
    return { version: 1, salt, key: key.toString("hex"), changedAt: new Date().toISOString() };
  } finally {
    key.fill(0);
  }
}

export async function readAccountAdminCredential(
  file: string,
): Promise<AccountAdminCredential | null> {
  try {
    const value = JSON.parse(await readFile(file, "utf8")) as AccountAdminCredential;
    if (
      value.version !== 1 ||
      !/^[a-f0-9]{32}$/.test(value.salt) ||
      !/^[a-f0-9]{64}$/.test(value.key)
    )
      throw new Error("إعداد رمز الإدارة غير صالح.");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("تعذر قراءة إعداد رمز الإدارة.");
  }
}

export async function verifyAccountAdminCode(code: unknown, credential: AccountAdminCredential) {
  if (typeof code !== "string" || code.length < 8 || code.length > 128) return false;
  const bytes = Buffer.from(code, "utf8");
  let derived: Buffer | undefined;
  try {
    derived = await derive(bytes, credential.salt);
    return timingSafeEqual(derived, Buffer.from(credential.key, "hex"));
  } finally {
    bytes.fill(0);
    derived?.fill(0);
  }
}
