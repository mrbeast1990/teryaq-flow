import { createFileRoute } from "@tanstack/react-router";
import { FileDown, Printer, RefreshCw, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, type AccountPerson, getSuppliers } from "@/lib/api";

export const Route = createFileRoute("/accounts/suppliers/")({
  head: () => ({
    meta: [{ title: "الموردين — Teryaq" }],
  }),
  component: SuppliersPage,
});

type BalanceFilter = "all" | "nonzero" | "creditors";

const filterOptions: { id: BalanceFilter; label: string }[] = [
  { id: "nonzero", label: "لهم رصيد" },
  { id: "all", label: "الجميع" },
  { id: "creditors", label: "الدائنون فقط" },
];

const PAGE_SIZE = 50;

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "لا توجد حركة";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function balanceTone(value?: number | null): "positive" | "negative" | "neutral" {
  const balance = Number(value || 0);
  if (balance > 0) return "positive";
  if (balance < 0) return "negative";
  return "neutral";
}

function apiBalanceFilter(filter: BalanceFilter): "all" | "nonzero" | "creditors" {
  if (filter === "all") return "all";
  if (filter === "creditors") return "creditors";
  return "nonzero";
}

function exportSuppliers(rows: AccountPerson[]) {
  if (!rows.length) {
    window.alert("لا توجد بيانات للتصدير.");
    return;
  }
  const headers = ["المورد", "الهاتف", "الرصيد", "آخر حركة", "آخر مبلغ"];
  const lines = rows.map((row) => [
    row.name || "",
    row.phone || "",
    String(row.currentBalance ?? 0),
    formatDate(row.lastTransactionDate),
    String(row.lastTransactionAmount ?? ""),
  ]);
  const csv = [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function printSuppliers(rows: AccountPerson[], title: string) {
  if (!rows.length) {
    window.alert("لا توجد بيانات للطباعة.");
    return;
  }
  const htmlRows = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.phone)}</td>
      <td>${formatNumber(row.currentBalance)}</td>
      <td>${formatDate(row.lastTransactionDate)}</td>
      <td>${escapeHtml(row.lastTransactionAmount)}</td>
    </tr>
  `).join("");
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) {
    window.alert("تعذر فتح نافذة الطباعة.");
    return;
  }
  popup.document.write(`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body { font-family: Cairo, Arial, sans-serif; direction: rtl; padding: 24px; color: #111827; }
          h1 { margin: 0 0 4px; font-size: 22px; }
          p { margin: 0 0 16px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 7px; text-align: right; vertical-align: top; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>صيدلية الترياق الشافي</h1>
        <p>${title} · ${new Date().toLocaleString("ar-LY")}</p>
        <table>
          <thead>
            <tr><th>المورد</th><th>الهاتف</th><th>الرصيد</th><th>آخر حركة</th><th>آخر مبلغ</th></tr>
          </thead>
          <tbody>${htmlRows}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}

function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BalanceFilter>("nonzero");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const query = useQuery({
    queryKey: ["accounts", "suppliers", search, filter, page, PAGE_SIZE],
    queryFn: () => getSuppliers({ search, balanceFilter: apiBalanceFilter(filter), page, pageSize: PAGE_SIZE }),
  });

  const suppliers = query.data?.suppliers || [];
  const totalCount = Number(query.data?.totalCount ?? suppliers.length);
  const totalBalance = Number(query.data?.totalBalance ?? 0);
  const creditorBalance = Math.abs(Number(query.data?.negativeBalance ?? 0));
  const creditorCount = Number(query.data?.negativeCount ?? 0);
  const hasMore = Boolean(query.data?.hasMore);
  const pageSize = Number(query.data?.pageSize || PAGE_SIZE);
  const fromRow = totalCount ? ((page - 1) * pageSize) + 1 : 0;
  const toRow = Math.min(page * pageSize, totalCount);

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  async function fetchAllFilteredSuppliers() {
    const allRows: AccountPerson[] = [];
    let nextPage = 1;
    let keepLoading = true;
    while (keepLoading) {
      const response = await getSuppliers({
        search,
        balanceFilter: apiBalanceFilter(filter),
        page: nextPage,
        pageSize: 500,
      });
      allRows.push(...(response.suppliers || []));
      keepLoading = Boolean(response.hasMore);
      nextPage += 1;
    }
    return allRows;
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      exportSuppliers(await fetchAllFilteredSuppliers());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "تعذر تصدير الموردين.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePrint() {
    setIsPrinting(true);
    try {
      printSuppliers(await fetchAllFilteredSuppliers(), "تقرير أرصدة الموردين");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "تعذر طباعة الموردين.");
    } finally {
      setIsPrinting(false);
    }
  }

  return (
    <AppShell>
      <div className="sticky top-0 z-20 mb-2 bg-background/80 px-1 pb-2 pt-1 backdrop-blur-md">
        <PageHeader
          title="الموردين"
          showBack
          actions={
            <div className="flex gap-1">
              <ActionButton label={isPrinting ? "..." : "طباعة"} icon={Printer} onClick={handlePrint} disabled={isPrinting || query.isLoading} variant="outline" />
              <ActionButton label={isExporting ? "..." : "تصدير"} icon={FileDown} onClick={handleExport} disabled={isExporting || query.isLoading} variant="outline" />
              <ActionButton label="تحديث" icon={RefreshCw} onClick={() => query.refetch()} variant="outline" />
            </div>
          }
        />
        <div className="mt-2 space-y-2">
          <SearchInput
            placeholder="اسم المورد، الهاتف، أو الرقم..."
            value={search}
            onChange={(value) => setSearch(value)}
          />
          <FilterBar>
            {filterOptions.map((option) => (
              <FilterChip key={option.id} label={option.label} active={filter === option.id} onClick={() => setFilter(option.id)} />
            ))}
          </FilterBar>
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
        ) : !suppliers.length ? (
          <EmptyState title="لا توجد موردين مطابقين" description="غيّر البحث أو الفلتر لعرض نتائج أخرى." />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">عدد النتائج</p>
                <p className="text-base font-bold text-foreground">{formatNumber(totalCount)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">صافي الرصيد</p>
                <p className="text-base font-bold text-foreground">{formatNumber(totalBalance)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">الدائنون</p>
                <p className="text-base font-bold text-red-700">{formatNumber(creditorCount)}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground">إجمالي الدائن</p>
                <p className="text-base font-bold text-red-700">{formatNumber(creditorBalance)}</p>
              </div>
            </div>
            <p className="px-1 text-[12px] text-muted-foreground">
              يعرض {formatNumber(fromRow)}-{formatNumber(toRow)} من {formatNumber(totalCount)} مورد
            </p>
            <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border/50">
              {suppliers.map((account) => (
                <CompactListCard
                  key={account.id}
                  title={account.name || "غير محدد"}
                  subtitle={`${account.phone || "هاتف غير مسجل"} · آخر حركة: ${formatDate(account.lastTransactionDate)}`}
                  value={formatNumber(account.currentBalance)}
                  meta="الرصيد"
                  icon={Truck}
                  to={`/accounts/suppliers/${account.id}`}
                  valueTone={balanceTone(account.currentBalance)}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                label="السابق"
                variant="outline"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              />
              <ActionButton
                label="التالي"
                variant="outline"
                disabled={!hasMore || query.isFetching}
                onClick={() => setPage((current) => current + 1)}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
