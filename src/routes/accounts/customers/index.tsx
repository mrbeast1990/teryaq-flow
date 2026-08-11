import { createFileRoute } from "@tanstack/react-router";
import { FileDown, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, type AccountPerson, getCustomers } from "@/lib/api";

export const Route = createFileRoute("/accounts/customers/")({
  head: () => ({
    meta: [{ title: "الزبائن — Teryaq" }],
  }),
  component: CustomersPage,
});

type BalanceFilter = "all" | "hasBalance" | "zeroBalance";

const filterOptions: { id: BalanceFilter; label: string }[] = [
  { id: "all", label: "الجميع" },
  { id: "hasBalance", label: "عليهم رصيد" },
  { id: "zeroBalance", label: "رصيد صفر" },
];

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "لا توجد حركة";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function matchesSearch(account: AccountPerson, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [account.name, account.phone, account.address, String(account.id)]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

function exportCustomers(rows: AccountPerson[]) {
  if (!rows.length) {
    window.alert("لا توجد بيانات للتصدير.");
    return;
  }
  const headers = ["الاسم", "الهاتف", "الرصيد", "آخر حركة", "آخر مبلغ"];
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
  anchor.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BalanceFilter>("all");

  const query = useQuery({
    queryKey: ["accounts", "customers"],
    queryFn: () => getCustomers(),
  });

  const customers = query.data?.customers || [];
  const visibleCustomers = useMemo(() => {
    return customers
      .filter((account) => matchesSearch(account, search))
      .filter((account) => {
        if (filter === "hasBalance") return Number(account.currentBalance || 0) > 0;
        if (filter === "zeroBalance") return Number(account.currentBalance || 0) === 0;
        return true;
      });
  }, [customers, filter, search]);

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader
          title="الزبائن"
          showBack
          actions={
            <div className="flex gap-1">
              <ActionButton label="تصدير" icon={FileDown} onClick={() => exportCustomers(visibleCustomers)} variant="outline" />
              <ActionButton label="تحديث" icon={RefreshCw} onClick={() => query.refetch()} variant="outline" />
            </div>
          }
        />
        <div className="mt-2 space-y-2">
          <SearchInput
            placeholder="اسم الزبون، الهاتف، أو الرقم..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
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
        ) : !visibleCustomers.length ? (
          <EmptyState title="لا توجد زبائن مطابقة" description="غيّر البحث أو الفلتر لعرض نتائج أخرى." />
        ) : (
          <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border/50">
            {visibleCustomers.map((account) => (
              <CompactListCard
                key={account.id}
                title={account.name || "غير محدد"}
                subtitle={`${account.phone || "هاتف غير مسجل"} · آخر حركة: ${formatDate(account.lastTransactionDate)}`}
                value={formatNumber(account.currentBalance)}
                meta="الرصيد"
                icon={UserRound}
                to={`/accounts/customers/${account.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
