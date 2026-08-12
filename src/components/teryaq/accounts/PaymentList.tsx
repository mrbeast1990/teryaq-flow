import { useQuery } from "@tanstack/react-query";
import { ApiError, type CustomerReceiptRow, type SupplierPaymentRow, getCustomerReceipts, getSupplierPayments } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/teryaq/States";

interface Props {
  type: "customer" | "supplier";
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

export function PaymentList({ type, accountId }: Props) {
  const query = useQuery({
    queryKey: ["accounts", type, accountId, "payments"],
    queryFn: () => (type === "customer" ? getCustomerReceipts(accountId) : getSupplierPayments(accountId)) as Promise<RowsResponse<CustomerReceiptRow | SupplierPaymentRow>>,
  });

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const rows = (query.data as RowsResponse<CustomerReceiptRow | SupplierPaymentRow>)?.rows || [];

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState description={errorMessage} onRetry={() => query.refetch()} />;
  if (!rows.length) {
    return <EmptyState title="لا توجد سدادات" description="لم يتم العثور على حركات سداد لهذا الحساب." />;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => {
        const isSupplierPayment = "paymentNumber" in row;
        const number = isSupplierPayment ? row.paymentNumber : row.receiptNumber;
        const method = isSupplierPayment ? row.paymentMethod : row.notes;
        const invoiceNo = isSupplierPayment ? row.invoiceNumber : null;
        return (
          <article key={`${number}-${index}`} className="card-surface p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-extrabold">{number || "سداد"}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDate(row.date)}
                  {invoiceNo ? ` · حركة ${invoiceNo}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-left">
                <p className="num text-[13px] font-extrabold">{formatNumber(row.amount)}</p>
                <p className="text-[11px] text-muted-foreground">المبلغ</p>
              </div>
            </div>
            {method ? <p className="mt-2 rounded-lg bg-secondary/50 px-2 py-1 text-[12px] text-muted-foreground">{method}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
