import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
});
const temp = await mkdtemp(path.join(os.tmpdir(), "flow-account-test-"));
try {
  const { createAccountMetadataStore } = await server.ssrLoadModule(
    "/src/lib/accountMetadataStore.server.ts",
  );
  const { createAccountAdminCredential } = await server.ssrLoadModule(
    "/src/lib/accountAdminCredential.server.ts",
  );
  const { createAccountAdminSecurity } = await server.ssrLoadModule(
    "/src/lib/accountAdminSecurity.server.ts",
  );
  const { libyaWhatsappNumber } = await server.ssrLoadModule("/src/lib/accountDirectory.ts");
  const sourceId = "a".repeat(64);
  const store = createAccountMetadataStore(temp);
  const first = await store.update(
    {
      sourceId,
      kind: "customer",
      personNo: 375,
      phone: " 091-2345678 ",
      closed: true,
      revision: 0,
      originalPhone: "0920000000",
    },
    "test",
  );
  assert.equal(first.phone, " 091-2345678 ");
  assert.equal(libyaWhatsappNumber(first.phone), "218912345678");
  assert.equal(
    (await createAccountMetadataStore(temp).records(sourceId, "customer"))[0].closed,
    true,
  );
  assert.equal((await store.records(sourceId, "supplier")).length, 0);
  assert.equal((await store.records("b".repeat(64), "customer")).length, 0);
  await assert.rejects(
    store.update({ sourceId, kind: "customer", personNo: 375, phone: "", revision: 1 }, "test"),
  );
  await assert.rejects(
    store.update(
      { sourceId, kind: "customer", personNo: 375, phone: "091\n1234", revision: 1 },
      "test",
    ),
  );
  await assert.rejects(
    store.update({ sourceId, kind: "customer", personNo: 375, closed: false, revision: 0 }, "test"),
  );
  await store.update(
    { sourceId, kind: "customer", personNo: 375, closed: false, revision: 1 },
    "test",
  );
  assert.equal((await store.records(sourceId, "customer"))[0].phone, first.phone);
  assert.equal(
    JSON.parse(await readFile(path.join(temp, "accounts.json"), "utf8")).history.length,
    2,
  );
  console.log(
    "PASS persistence, identity isolation, original/raw phone, blank rejection, revision conflict, reopen, audit",
  );
  const secret = randomBytes(24).toString("hex");
  const bytes = Buffer.from(secret);
  const credential = await createAccountAdminCredential(bytes);
  bytes.fill(0);
  await writeFile(path.join(temp, "credential.json"), JSON.stringify(credential));
  let now = Date.now();
  const auth = createAccountAdminSecurity(temp, () => now);
  const request = (cookie = "", origin = "https://flow.test") =>
    new Request("https://flow.test/_flow/accounts", {
      method: "POST",
      headers: { origin, "content-type": "application/json", cookie },
    });
  await assert.rejects(auth.authorize(request()));
  await assert.rejects(auth.login(request("", "https://evil.test"), secret));
  const login = await auth.login(request(), secret);
  const cookie = login.cookie.split(";")[0];
  assert.match(login.cookie, /HttpOnly/);
  assert.match(login.cookie, /SameSite=Strict/);
  assert.match(login.cookie, /Secure/);
  assert.equal((await auth.status(request(cookie))).authenticated, true);
  await auth.authorize(request(cookie));
  auth.logout(request(cookie));
  await assert.rejects(auth.authorize(request(cookie)));
  const again = await auth.login(request(), secret);
  now += 11 * 60000;
  await assert.rejects(auth.authorize(request(again.cookie.split(";")[0])));
  for (let i = 0; i < 5; i++) await assert.rejects(auth.login(request(), "not-the-code"));
  await assert.rejects(auth.login(request(), secret), (e) => e.status === 429);
  const fresh = createAccountAdminSecurity(temp);
  assert.equal((await fresh.status(request(cookie))).authenticated, false);
  console.log(
    "PASS server authorization, CSRF, secure cookie, logout, idle expiry, restart session revocation, rate limit",
  );
} finally {
  await server.close();
  await rm(temp, { recursive: true, force: true });
}
