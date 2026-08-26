import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, PackageSearch, Receipt, Users, Truck, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { getAnalyticsGlobalSearch, ApiError, type AnalyticsSearchRow } from "@/lib/api";

export const Route = createFileRoute("/analytics/search")({
  head: () => ({
    meta: [{ title: "البحث الشامل — Teryaq" }],
  }),
  component: GlobalSearchPage,
});

const TYPE_LABELS: Record<string, string> = {
  item: "صنف",
  customer: "زبون",
  supplier: "مورد",
  "sales-invoice": "فاتورة بيع",
  "purchase-invoice": "فاتورة شراء",
  "revenue-movement": "حركة",
};

function targetHref(row: AnalyticsSearchRow) {
  if (row.targetType === "item") return "/items/track";
  if (row.targetType === "customer") return `/accounts/customers/${row.targetId}`;
  if (row.targetType === "supplier") return `/accounts/suppliers/${row.targetId}`;
  return null;
}

function targetIcon(type: string) {
  if (type === "item") return PackageSearch;
  if (type === "customer") return Users;
  if (type === "supplier") return Truck;
  if (type.includes("invoice")) return Receipt;
  if (type === "revenue-movement") return WalletCards;
  return FileText;
}

function invoiceType(row: AnalyticsSearchRow): "sales" | "purchase" | null {
  if (row.targetType === "sales-invoice") return "sales";
  if (row.targetType === "purchase-invoice") return "purchase";
  return null;
}

function ResultCard({
  row,
  onOpenInvoice,
}: {
  row: AnalyticsSearchRow;
  onOpenInvoice: (type: "sales" | "purchase", movementNo: string) => void;
}) {
  const href = targetHref(row);
  const invoice = invoiceType(row);
  const Icon = targetIcon(row.targetType);
  const content = (
    <div className="card-surface grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/50">
      <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold">{row.title || "بدون اسم"}</p>
        <p className="truncate text-[11px] text-muted-foreground">{row.subtitle || row.id}</p>
      </div>
      <div className="shrink-0 text-left">
        <p className="text-[11px] font-bold text-muted-foreground">{TYPE_LABELS[row.targetType] || row.resultType}</p>
        {href || invoice ? <p className="text-[11px] font-bold text-primary">فتح</p> : null}
      </div>
    </div>
  );

  if (invoice) {
    return (
      <button
        type="button"
        onClick={() => onOpenInvoice(invoice, String(row.targetId))}
        className="block w-full touch-manipulation text-right active:scale-[0.99]"
      >
        {content}
      </button>
    );
  }

  if (!href) return content;
  return (
    <Link to={href} className="block touch-manipulation active:scale-[0.99]">
      {content}
    </Link>
  );
}

function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<{ type: "sales" | "purchase"; movementNo: string } | null>(null);
  const trimmed = query.trim();

  const searchQuery = useQuery({
    queryKey: ["analytics", "global-search", trimmed],
    queryFn: () => getAnalyticsGlobalSearch(trimmed),
    enabled: trimmed.length > 0,
  });

  const rows = searchQuery.data?.rows || [];
  const grouped = useMemo(() => {
    return rows.reduce<Record<string, AnalyticsSearchRow[]>>((acc, row) => {
      const key = row.targetType || row.resultType || "other";
      acc[key] = acc[key] || [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [rows]);
  const errorMessage = searchQuery.error instanceof ApiError || searchQuery.error instanceof Error ? searchQuery.error.message : undefined;

  if (selectedInvoice) {
    return (
      <AppShell>
        <InvoiceDetailsView
          type={selectedInvoice.type}
          movementNo={selectedInvoice.movementNo}
          onBack={() => setSelectedInvoice(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="البحث الشامل"
        subtitle="بحث موحد في الأصناف والزبائن والموردين والفواتير والحركات من Teryaq SQL."
      />

      <div className="sticky top-0 z-10 -mx-4 mb-4 bg-slate-50/80 px-4 py-3 backdrop-blur-sm dark:bg-slate-900/80">
        <SearchInput
          placeholder="ابحث باسم صنف، باركود، زبون، مورد، رقم فاتورة أو حركة..."
          value={query}
          onChange={setQuery}
        />
      </div>

      {!trimmed ? (
        <EmptyState
          title="ابدأ البحث الآن"
          description="النتائج تأتي مباشرة من قاعدة المحاسب عبر Teryaq SQL."
          icon={Search}
        />
      ) : searchQuery.isLoading || searchQuery.isFetching ? (
        <LoadingState rows={5} />
      ) : searchQuery.isError ? (
        <ErrorState description={errorMessage} onRetry={() => searchQuery.refetch()} />
      ) : !rows.length ? (
        <EmptyState title="لا توجد نتائج" description={`لم يتم العثور على نتائج مطابقة لـ "${trimmed}".`} />
      ) : (
        <div className="space-y-5 pb-8">
          {Object.entries(grouped).map(([type, typeRows]) => (
            <section key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-black">{TYPE_LABELS[type] || typeRows[0]?.resultType || "نتائج"}</h2>
                <span className="num text-[11px] font-bold text-muted-foreground">{typeRows.length}</span>
              </div>
              <div className="space-y-2">
                {typeRows.map((row) => (
                  <ResultCard
                    key={`${row.targetType}-${row.targetId}-${row.title}`}
                    row={row}
                    onOpenInvoice={(type, movementNo) => setSelectedInvoice({ type, movementNo })}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}
