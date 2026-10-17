import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const temp = await mkdtemp(path.join(os.tmpdir(), "flow-organization-test-"));
const vite = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
});
process.chdir(temp);
try {
  const { handleAccountDirectoryRequest: handle } = await vite.ssrLoadModule(
    "/src/lib/accountDirectoryHandler.server.ts",
  );
  const { createAccountMetadataStore } = await vite.ssrLoadModule(
    "/src/lib/accountMetadataStore.server.ts",
  );
  const { libyaWhatsappNumber } = await vite.ssrLoadModule("/src/lib/accountDirectory.ts");
  const get = async (query) => {
    const r = await handle(new Request("https://flow.test/_flow/accounts?" + query));
    assert.equal(r.status, 200);
    return r.json();
  };
  const post = (
    input,
    origin = "https://flow.test",
    contentType = "application/json",
    action = "update",
  ) =>
    handle(
      new Request("https://flow.test/_flow/accounts?action=" + action, {
        method: "POST",
        headers: { origin, "content-type": contentType },
        body: JSON.stringify(input),
      }),
    );
  const initial = await get("kind=customer&state=all&balanceFilter=all&pageSize=500&search=375");
  const row = initial.rows.find((r) => Number(r.id) === 375);
  assert.ok(row, "Real account 375 required");
  const base = {
    sourceId: initial.sourceId,
    kind: "customer",
    personNo: 375,
    revision: row.revision,
  };
  const saved = await post({ ...base, closed: true, phone: " 091-2345678 " });
  assert.equal(saved.status, 200);
  assert.equal(saved.headers.get("set-cookie"), null);
  const meta = (await saved.json()).metadata;
  assert.equal(meta.phone, " 091-2345678 ");
  assert.equal(libyaWhatsappNumber(meta.phone), "218912345678");
  const active = await get("kind=customer&state=active&balanceFilter=all&search=375");
  const closed = await get("kind=customer&state=closed&balanceFilter=all&search=375");
  assert.equal(closed.totalCount, 1);
  assert.equal(closed.rows[0].currentBalance, row.currentBalance);
  assert.equal(active.totalCount, initial.totalCount - 1);
  assert.ok(Math.abs(active.activeBalance + active.closedBalance - initial.totalBalance) < 1e-6);
  const restored = createAccountMetadataStore(path.join(temp, ".data", "account-administration"));
  const records = await restored.records(initial.sourceId, "customer");
  assert.equal(records[0].closed, true);
  assert.equal(records[0].phone, meta.phone);
  assert.equal((await restored.records(initial.sourceId, "supplier")).length, 0);
  assert.equal((await restored.records("b".repeat(64), "customer")).length, 0);
  assert.equal((await post({ ...base, closed: false })).status, 409);
  assert.equal((await post({ ...base, revision: meta.revision, phone: "" })).status, 400);
  assert.equal((await post({ ...base, revision: meta.revision, phone: "---" })).status, 400);
  assert.equal((await post({ ...base, revision: meta.revision, phone: "091\n1234" })).status, 400);
  assert.equal((await post({ ...base, sourceId: "b".repeat(64) })).status, 409);
  assert.equal((await post(base, "https://evil.test")).status, 403);
  assert.equal((await post(base, "")).status, 403);
  assert.equal((await post(base, "https://flow.test", "text/plain")).status, 415);
  assert.equal((await post({ padding: "a".repeat(5000) })).status, 413);
  assert.equal((await post({}, "https://flow.test", "application/json", "login")).status, 404);
  const reopened = await post({ ...base, revision: meta.revision, closed: false });
  assert.equal(reopened.status, 200);
  const latest = (await reopened.json()).metadata;
  assert.equal(latest.closed, false);
  assert.equal(latest.phone, meta.phone);
  const db = JSON.parse(
    await readFile(path.join(temp, ".data", "account-administration", "accounts.json"), "utf8"),
  );
  assert.equal(db.history.length, 2);
  const after = await get("kind=customer&state=active&balanceFilter=all&search=375");
  assert.equal(after.totalCount, initial.totalCount);
  assert.equal(after.totalBalance, initial.totalBalance);
  console.log(
    "PASS real-data phone edit/disable/reactivate without code or cookie; persistent store; active/closed totals; unchanged balances; identity isolation; validation/conflicts; origin checks; removed login",
  );
} finally {
  process.chdir(root);
  await vite.close();
  await rm(temp, { recursive: true, force: true });
}
