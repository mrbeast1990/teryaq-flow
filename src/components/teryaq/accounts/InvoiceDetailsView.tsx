import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Printer } from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, getPurchaseInvoice, getSalesInvoice } from "@/lib/api";

interface Props {
  type: "sales" | "purchase";
  movementNo: string;
  onBack?: () => void;
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

export function InvoiceDetailsView({ type, movementNo, onBack }: Props) {
  const query = useQuery({
    queryKey: ["accounts", "invoice", type, movementNo],
    queryFn: () => (type === "sales" ? getSalesInvoice(movementNo) : getPurchaseInvoice(movementNo)),
  });

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const header = query.data?.header;
  const items = query.data?.items || [];

  if (query.isLoading) return <LoadingState rows={5} />;
  if (query.isError || !header) return <ErrorState description={errorMessage || "لم يتم العثور على الفاتورة."} onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold">{type === "sales" ? "فاتورة بيع" : "فاتورة شراء"}</h3>
          <p className="text-[11px] text-muted-foreground">رقم الحركة: {movementNo}</p>
        </div>
        <div className="flex gap-1">
          {onBack ? <ActionButton label="رجوع" icon={ArrowRight} onClick={onBack} variant="outline" /> : null}
          <ActionButton label="طباعة" icon={Printer} onClick={() => window.print()} variant="outline" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/10 p-3 text-[12px]">
        <InfoCell label="رقم الفاتورة" value={String(header.invoiceNo || header.movementNo || "-")} />
        <InfoCell label="التاريخ" value={formatDate(header.date)} />
        <InfoCell label={type === "sales" ? "الزبون" : "المورد"} value={header.personName || "-"} />
        <InfoCell label="نوع الحساب" value={header.accountLabel || "-"} />
        <InfoCell label="الإجمالي" value={formatNumber(header.total)} important />
        <InfoCell label="ملاحظات" value={header.notes || "-"} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-bold">الأصناف</p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{items.length}</span>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <article key={`${item.itemNo}-${item.barcode}-${index}`} className="card-surface p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold">{item.itemName || "-"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    كود: {item.itemNo || "-"} · باركود: {item.barcode || "غير مسجل"}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="num text-[13px] font-extrabold">{formatNumber(item.total)}</p>
                  <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                <MiniCell label="الكمية" value={`${formatNumber(item.quantity)} ${item.unitName || ""}`} />
                <MiniCell label="السعر" value={formatNumber(item.price)} />
                <MiniCell label="الإجمالي" value={formatNumber(item.total)} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value, important = false }: { label: string; value: string; important?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-[11px] font-bold text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-[12px] ${important ? "num font-extrabold" : "font-bold"}`}>{value}</p>
    </div>
  );
}

function MiniCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 px-2 py-1">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="num text-[12px] font-extrabold">{value}</p>
    </div>
  );
}
