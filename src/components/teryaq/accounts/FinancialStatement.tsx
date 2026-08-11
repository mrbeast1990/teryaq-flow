import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, type StatementRow, getCustomerLedger, getSupplierLedger } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";
import { InvoiceDetailsView } from "./InvoiceDetailsView";

interface Props {
  type: "customer" | "supplier";
  id: string;
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

function invoiceTypeFor(row: StatementRow, type: Props["type"]) {
  if (row.rowType === "sales-invoice") return "sales";
  if (row.rowType === "purchase-invoice") return "purchase";
  return type === "customer" ? "sales" : "purchase";
}

export function FinancialStatement({ type, id }: Props) {
  const [selectedInvoice, setSelectedInvoice] = useState<{ type: "sales" | "purchase"; movementNo: string } | null>(null);
  const query = useQuery({
    queryKey: ["accounts", type, id, "ledger"],
    queryFn: () => (type === "customer" ? getCustomerLedger(id) : getSupplierLedger(id)),
  });

  if (selectedInvoice) {
    return <InvoiceDetailsView type={selectedInvoice.type} movementNo={selectedInvoice.movementNo} onBack={() => setSelectedInvoice(null)} />;
  }

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const rows = query.data?.rows || [];

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState description={errorMessage} onRetry={() => query.refetch()} />;
  if (!rows.length) {
    return <EmptyState title="لا توجد حركات في كشف الحساب" description="لا توجد عمليات مالية لهذا الحساب ضمن البيانات المتاحة." />;
  }

  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-5 gap-2 border-b border-border px-3 py-2 text-[11px] font-bold text-muted-foreground sm:grid">
        <div>التاريخ</div>
        <div>البيان</div>
        <div className="text-left">مدين</div>
        <div className="text-left">دائن</div>
        <div className="text-left">الرصيد</div>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => {
          const clickable = row.rowType !== "payment" && row.refNo;
          return (
            <button
              key={`${row.date}-${row.refNo}-${index}`}
              type="button"
              onClick={() => {
                if (!clickable || !row.refNo) return;
                setSelectedInvoice({ type: invoiceTypeFor(row, type), movementNo: String(row.refNo) });
              }}
              className={`card-surface w-full p-3 text-right ${clickable ? "transition-colors hover:bg-secondary/50" : "cursor-default"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold">{row.description || "-"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(row.date)}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="num text-[13px] font-extrabold">{formatNumber(row.runningBalance)}</p>
                  <p className="text-[11px] text-muted-foreground">الرصيد</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-lg bg-secondary/50 px-2 py-1">
                  <span className="text-muted-foreground">مدين: </span>
                  <span className="num font-bold">{formatNumber(row.debit)}</span>
                </div>
                <div className="rounded-lg bg-secondary/50 px-2 py-1">
                  <span className="text-muted-foreground">دائن: </span>
                  <span className="num font-bold">{formatNumber(row.credit)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
