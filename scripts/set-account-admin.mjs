import { mkdir, writeFile, rename } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createAccountAdminCredential } from "../src/lib/accountAdminCredential.server.ts";

const chunks = [];
let size = 0;
try {
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 512) throw new Error("Invalid code length.");
    chunks.push(chunk);
  }
  const secret = Buffer.concat(chunks);
  try {
    const credential = await createAccountAdminCredential(secret);
    const directory = path.join(process.cwd(), ".data", "account-administration");
    await mkdir(directory, { recursive: true });
    const target = path.join(directory, "credential.json");
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(credential), { mode: 0o600 });
    await rename(temporary, target);
    console.log("Administration code configured. No restart required.");
  } finally {
    secret.fill(0);
  }
} catch {
  console.error("Administration code setup failed. Nothing was printed or logged.");
  process.exitCode = 1;
} finally {
  for (const chunk of chunks) chunk.fill(0);
}
