import assert from "node:assert/strict";
import { createServer } from "vite";
import { unzipSync, strFromU8 } from "fflate";

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: "custom",
});
const originalTZ = process.env.TZ;
try {
  const { accountingDate, accountingDateText, accountSheetData, accountExcelBlob } =
    await vite.ssrLoadModule("/src/lib/accountExcelExport.ts");
  for (const tz of ["UTC", "Africa/Tripoli", "America/Los_Angeles", "Pacific/Kiritimati"]) {
    process.env.TZ = tz;
    for (const input of [
      "2026-09-12",
      "2026-09-12T00:00:00.000Z",
      "2026-09-12T23:59:59-12:00",
      "2026-09-12T00:01:00+14:00",
    ]) {
      assert.equal(accountingDateText(input), "12/09/2026");
      assert.equal(accountingDate(input).toISOString(), "2026-09-12T00:00:00.000Z");
    }
    assert.equal(accountingDateText("2024-02-29T23:59:00Z"), "29/02/2024");
    for (const empty of [null, undefined, "", "  "]) {
      assert.equal(accountingDate(empty), null);
      assert.equal(accountingDateText(empty), "");
    }
    for (const invalid of ["2026-02-29", "2026-13-01", "2026-00-01", "not-a-date"])
      assert.throws(() => accountingDate(invalid));
  }
  console.log(
    "PASS calendar-day preservation across 4 time zones, offsets, midnight, leap day, missing/invalid dates",
  );
  for (const kind of ["customer", "supplier"]) {
    const rows = [];
    for (let page = 1; ; page++) {
      const response = await fetch(
        `http://127.0.0.1:5180/_flow/accounts?kind=${kind}&state=all&balanceFilter=all&pageSize=500&page=${page}`,
      );
      assert.equal(response.status, 200);
      const data = await response.json();
      rows.push(...data.rows);
      if (!data.hasMore) break;
    }
    const sheet = accountSheetData(rows, kind);
    const files = unzipSync(
      new Uint8Array(await (await accountExcelBlob(rows, kind)).arrayBuffer()),
    );
    const xml = strFromU8(files["xl/worksheets/sheet1.xml"]);
    const styles = strFromU8(files["xl/styles.xml"]);
    assert.match(styles, /formatCode="dd\/mm\/yyyy"/);
    assert.equal((xml.match(/<row\b/g) || []).length, rows.length + 1);
    let dates = 0,
      blanks = 0;
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      for (const [column, key] of [
        ["E", kind === "customer" ? "lastSaleDate" : "lastPurchaseDate"],
        ["F", kind === "customer" ? "lastCollectionDate" : "lastPaymentDate"],
      ]) {
        const ref = `${column}${index + 2}`;
        const cell = xml.match(new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*>([\\s\\S]*?)<\\/c>`));
        if (!row[key]) {
          assert.ok(!cell || !cell[1].includes("<v>"));
          blanks++;
          continue;
        }
        assert.ok(cell, ref);
        assert.match(cell[1], /^<v>[0-9]+<\/v>$/);
        const serial = Number(cell[1].match(/<v>([^<]+)<\/v>/)[1]);
        assert.ok(Number.isInteger(serial));
        const day = new Date((serial - 25569) * 86400000).toISOString().slice(0, 10);
        assert.equal(day, row[key].slice(0, 10));
        assert.equal(sheet[index + 1][column === "E" ? 4 : 5].format, "dd/mm/yyyy");
        dates++;
      }
      assert.equal(sheet[index + 1][2].value, row.currentBalance);
      assert.equal(sheet[index + 1][0].value, row.name || "");
    }
    console.log(
      "PASS actual XLSX contents",
      kind,
      JSON.stringify({
        rows: rows.length,
        dateCells: dates,
        blankDateCells: blanks,
        format: "dd/mm/yyyy",
      }),
    );
  }
} finally {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
  await vite.close();
}
