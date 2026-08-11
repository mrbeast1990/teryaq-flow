import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, type CustomerInvoiceRow, type SupplierInvoiceRow, getCustomerInvoices, getSupplierInvoices } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { InvoiceDetailsView } from "./InvoiceDetailsView";

interface Props {
  type: "sales" | "purchase";
  accountId: string;
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function movementNo(row: CustomerInvoiceRow | SupplierInvoiceRow) {
  return String(row.invoiceNumber || "");
}

export function InvoiceList({ type, accountId }: Props) {
  const [selectedMovementNo, setSelectedMovementNo] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["accounts", type, accountId, "invoices"],
    queryFn: () => (type === "sales" ? getCustomerInvoices(accountId) : getSupplierInvoices(accountId)),
  });

  if (selectedMovementNo) {
    return <InvoiceDetailsView type={type} movementNo={selectedMovementNo} onBack={() => setSelectedMovementNo(null)} />;
  }

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const rows = query.data?.rows || [];

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState description={errorMessage} onRetry={() => query.refetch()} />;
  if (!rows.length) {
    return (
      <EmptyState
        title="لا توجد فواتير"
        description={type === "sales" ? "لم يتم العثور على فواتير بيع لهذا الزبون." : "لم يتم العثور على فواتير شراء لهذا المورد."}
      />
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const no = movementNo(row);
        const supplierInvoice = "purchaseInvoice" in row ? row.purchaseInvoice : null;
        return (
          <button
            key={no}
            type="button"
            onClick={() => no && setSelectedMovementNo(no)}
            className="card-surface w-full p-3 text-right transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-extrabold">
                  {type === "sales" ? "فاتورة بيع" : "فاتورة شراء"} #{no || "-"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDate(row.date)}
                  {supplierInvoice ? ` · فاتورة المورد: ${supplierInvoice}` : ""}
                </p>
              </div>
              <div className="text-left">
                <p className="num text-[13px] font-extrabold">{formatNumber(row.total)}</p>
                <p className="text-[11px] text-muted-foreground">الإجمالي</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-lg bg-secondary/50 px-2 py-1">
                <span className="text-muted-foreground">المدفوع: </span>
                <span className="num font-bold">{formatNumber(row.paid)}</span>
              </div>
              <div className="rounded-lg bg-secondary/50 px-2 py-1">
                <span className="text-muted-foreground">المتبقي: </span>
                <span className="num font-bold">{formatNumber(row.remaining)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
