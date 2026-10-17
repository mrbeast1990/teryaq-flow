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
  const {
    accountingDate,
    accountingDateText,
    accountElapsedText,
    accountSheetData,
    accountExcelBlob,
  } = await vite.ssrLoadModule("/src/lib/accountExcelExport.ts");
  const { accountReportPrintHtml } = await vite.ssrLoadModule("/src/lib/accountReportPrint.ts");
  for (const tz of ["UTC", "Africa/Tripoli", "America/Los_Angeles", "Pacific/Kiritimati"]) {
    process.env.TZ = tz;
    assert.equal(accountElapsedText("2026-10-17", new Date("2026-10-16T22:00:00Z")), "اليوم");
    assert.equal(accountElapsedText("2026-10-16", new Date("2026-10-16T22:00:00Z")), "أمس");
    assert.equal(accountElapsedText("2026-10-16", new Date("2026-10-16T21:59:59Z")), "اليوم");
    assert.equal(accountElapsedText("2026-10-15", new Date("2026-10-16T22:00:00Z")), "منذ يومين");
    assert.equal(
      accountElapsedText("2026-09-27", new Date("2026-10-16T22:00:00Z")),
      "منذ 20 يومًا",
    );
    assert.equal(accountElapsedText("2026-10-14", new Date("2026-10-16T22:00:00Z")), "منذ 3 أيام");
    assert.equal(
      accountElapsedText("2026-10-18", new Date("2026-10-16T22:00:00Z")),
      "تاريخ مستقبلي",
    );
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
      assert.equal(accountElapsedText(empty), "");
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
    const now = new Date();
    const sheet = accountSheetData(rows, kind, now);
    const print = accountReportPrintHtml(rows, kind, "اختبار التصدير", now);
    assert.match(print, /size: A4 landscape/);
    assert.match(print, /table-layout: fixed/);
    assert.match(print, /color: #B91C1C/);
    assert.equal((print.match(/<th>/g) || []).length, 8);
    assert.equal((print.match(/class="elapsed"/g) || []).length, rows.length * 2);
    const files = unzipSync(
      new Uint8Array(await (await accountExcelBlob(rows, kind, now)).arrayBuffer()),
    );
    const xml = strFromU8(files["xl/worksheets/sheet1.xml"]);
    const styles = strFromU8(files["xl/styles.xml"]);
    assert.match(styles, /formatCode="dd\/mm\/yyyy"/);
    assert.match(styles, /B91C1C/);
    assert.match(xml, /<pageSetUpPr fitToPage="1"/);
    assert.match(xml, /<pageSetup[^>]*paperSize="9"/);
    assert.match(xml, /<pageSetup[^>]*fitToWidth="1"/);
    assert.ok(xml.indexOf("<sheetPr>") < xml.indexOf("<sheetViews>"));
    assert.equal(sheet[0].length, 8);
    assert.equal(sheet[0][5].value, "المدة");
    assert.equal(sheet[0][7].value, "المدة");
    assert.equal((xml.match(/<row\b/g) || []).length, rows.length + 1);
    let dates = 0,
      blanks = 0;
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      for (const [column, key] of [
        ["E", kind === "customer" ? "lastSaleDate" : "lastPurchaseDate"],
        ["G", kind === "customer" ? "lastCollectionDate" : "lastPaymentDate"],
      ]) {
        const ref = `${column}${index + 2}`;
        const cell = xml.match(new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*>([\\s\\S]*?)<\\/c>`));
        if (!row[key]) {
          assert.ok(!cell || !cell[1].includes("<v>"));
          assert.equal(sheet[index + 1][column === "E" ? 5 : 7], null);
          blanks++;
          continue;
        }
        assert.ok(cell, ref);
        assert.match(cell[1], /^<v>[0-9]+<\/v>$/);
        const serial = Number(cell[1].match(/<v>([^<]+)<\/v>/)[1]);
        assert.ok(Number.isInteger(serial));
        const day = new Date((serial - 25569) * 86400000).toISOString().slice(0, 10);
        assert.equal(day, row[key].slice(0, 10));
        assert.equal(sheet[index + 1][column === "E" ? 4 : 6].format, "dd/mm/yyyy");
        const elapsed = sheet[index + 1][column === "E" ? 5 : 7];
        assert.equal(elapsed.value, accountElapsedText(row[key], now));
        assert.equal(elapsed.textColor, "#B91C1C");
        assert.equal(elapsed.fontWeight, "bold");
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
