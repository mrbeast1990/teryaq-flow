import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, FileText, Receipt, RotateCcw, Search, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import {
  ApiError,
  getPurchasesReport,
  getReturnsReport,
  getSalesReport,
  type ReportInvoiceRow,
} from "@/lib/api";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [{ title: "مركز الفواتير — Teryaq" }],
  }),
  component: InvoiceCenterPage,
});

const PAGE_SIZE = 50;

type InvoiceTab = "sales" | "purchases" | "returns";
type ReturnType = "sales" | "purchase";
type InvoiceDetailsSelection = {
  type: "sales" | "purchase";
  movementNo: string;
  displayMovementNo?: string;
};

function localDateInput(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("ar-LY");
}

function formatCurrency(value?: number | null) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
  return (
    <span className="num inline-block whitespace-nowrap" dir="ltr">
      {formatted} د.ل
    </span>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : undefined;
}

function invoiceKind(tab: InvoiceTab, returnType: ReturnType): "sales" | "purchase" {
  if (tab === "purchases") return "purchase";
  if (tab === "returns" && returnType === "purchase") return "purchase";
  return "sales";
}

function InvoiceCenterPage() {
  const [tab, setTab] = useState<InvoiceTab>("sales");
  const [returnType, setReturnType] = useState<ReturnType>("sales");
  const [dateFrom, setDateFrom] = useState(localDateInput());
  const [dateTo, setDateTo] = useState(localDateInput());
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: localDateInput(),
    dateTo: localDateInput(),
    search: "",
  });
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailsSelection | null>(null);

  const query = useQuery({
    queryKey: ["invoice-center", tab, returnType, appliedFilters, page],
    queryFn: () => {
      const params = {
        dateFrom: appliedFilters.dateFrom,
        dateTo: appliedFilters.dateTo,
        search: appliedFilters.search || undefined,
        page,
        pageSize: PAGE_SIZE,
      };
      if (tab === "sales") return getSalesReport(params);
      if (tab === "purchases") return getPurchasesReport(params);
      return getReturnsReport({ ...params, type: returnType });
    },
  });

  const rows = query.data?.rows || [];
  const totalCount = Number(query.data?.summary?.movementCount || 0);
  const pageSize = Number(query.data?.pageSize || PAGE_SIZE);
  const hasNext = page * pageSize < totalCount;
  const kind = invoiceKind(tab, returnType);
  const title =
    tab === "sales"
      ? "فواتير البيع"
      : tab === "purchases"
        ? "فواتير الشراء"
        : returnType === "sales"
          ? "مردودات البيع"
          : "مردودات الشراء";
  const errorMessage = getErrorMessage(query.error);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({ dateFrom, dateTo, search: search.trim() });
  };

  const changeTab = (nextTab: string) => {
    setTab(nextTab as InvoiceTab);
    setPage(1);
    setSelectedInvoice(null);
  };

  if (selectedInvoice) {
    return (
      <AppShell>
        <InvoiceDetailsView
          type={selectedInvoice.type}
          movementNo={selectedInvoice.movementNo}
          displayMovementNo={selectedInvoice.displayMovementNo}
          onBack={() => setSelectedInvoice(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="مركز الفواتير" subtitle="بحث وتصفح فواتير البيع والشراء والمردودات من بيانات Teryaq SQL الحقيقية." />

      <div className="space-y-4">
        <div className="card-surface space-y-3 p-3">
          <SegmentedTabs
            value={tab}
            onChange={changeTab}
            options={[
              { id: "sales", label: "فواتير البيع" },
              { id: "purchases", label: "فواتير الشراء" },
              { id: "returns", label: "المردودات" },
            ]}
          />
          {tab === "returns" ? (
            <SegmentedTabs
              value={returnType}
              onChange={(value) => {
                setReturnType(value as ReturnType);
                setPage(1);
              }}
              options={[
                { id: "sales", label: "مردودات بيع" },
                { id: "purchase", label: "مردودات شراء" },
              ]}
            />
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
              من تاريخ
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
              />
            </label>
            <label className="space-y-1 text-[11px] font-bold text-muted-foreground">
              إلى تاريخ
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13px] font-bold text-foreground"
              />
            </label>
          </div>
          <SearchInput
            placeholder="بحث برقم الفاتورة أو الحركة أو اسم العميل/المورد..."
            value={search}
            onChange={setSearch}
          />
          <ActionButton label="بحث" icon={Search} onClick={applyFilters} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-[14px] font-black">{title}</h2>
              <p className="text-[11px] text-muted-foreground">
                <span className="num">{totalCount}</span> حركة مطابقة، الصفحة <span className="num">{page}</span>
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              {tab === "purchases" ? <ShoppingBag className="size-4" /> : tab === "returns" ? <RotateCcw className="size-4" /> : <Receipt className="size-4" />}
            </span>
          </div>

          {query.isLoading || query.isFetching ? (
            <LoadingState rows={6} />
          ) : query.isError ? (
            <ErrorState description={errorMessage} onRetry={() => query.refetch()} />
          ) : !rows.length ? (
            <EmptyState title="لا توجد فواتير" description="لا توجد نتائج مطابقة للفترة أو البحث الحالي." icon={FileText} />
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <InvoiceRowCard
                  key={`${tab}-${returnType}-${row.movementNo}-${row.invoiceNo}`}
                  row={row}
                  type={kind}
                  label={title}
                  onOpen={() =>
                    setSelectedInvoice({
                      type: kind,
                      movementNo: String(row.movementNo),
                      displayMovementNo: String(row.movementNo),
                    })
                  }
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <ActionButton
              label="السابق"
              variant="outline"
              disabled={page <= 1 || query.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            />
            <span className="text-[11px] font-bold text-muted-foreground">
              <span className="num">{Math.min(page * pageSize, totalCount)}</span> / <span className="num">{totalCount}</span>
            </span>
            <ActionButton
              label="التالي"
              variant="outline"
              disabled={!hasNext || query.isFetching}
              onClick={() => setPage((current) => current + 1)}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InvoiceRowCard({
  row,
  type,
  label,
  onOpen,
}: {
  row: ReportInvoiceRow;
  type: "sales" | "purchase";
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-surface grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3 text-right transition-colors hover:bg-secondary/50 active:scale-[0.99]"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-black text-primary">{label}</span>
          <span className="num text-[11px] font-bold text-muted-foreground">حركة {row.movementNo}</span>
          {row.invoiceNo ? <span className="num text-[11px] font-bold text-muted-foreground">فاتورة {row.invoiceNo}</span> : null}
        </div>
        <p className="truncate text-[13px] font-black">{row.personName || (type === "sales" ? "زبون غير محدد" : "مورد غير محدد")}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatDate(row.date)}
          {row.movementType ? ` · ${row.movementType}` : ""}
          {row.itemCount != null ? ` · ${row.itemCount} صنف` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span className="text-[13px] font-black">{formatCurrency(row.total)}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
          فتح
          <ChevronLeft className="size-3.5" />
        </span>
      </div>
    </button>
  );
}
