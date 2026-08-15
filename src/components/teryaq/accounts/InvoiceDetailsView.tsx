import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Printer, User, Calendar, Clock, Barcode, Receipt } from "lucide-react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { ErrorState, LoadingState } from "@/components/teryaq/States";
import { ApiError, getPurchaseInvoice, getSalesInvoice, type InvoiceItemRow as ApiInvoiceItemRow } from "@/lib/api";

interface Props {
  type: "sales" | "purchase";
  movementNo: string;
  onBack?: () => void;
  displayMovementNo?: string;
  transactionDateTime?: string | null | undefined;
  transactionDateTimeSource?: string | null | undefined;
}

function formatCurrency(value?: number | null) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
  
  return (
    <span className="inline-flex flex-row-reverse items-baseline gap-1" dir="ltr">
      <span>د.ل</span>
      <span className="num">{formatted}</span>
    </span>
  );
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const sqlDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  let date: Date;
  if (sqlDateTime) {
    const [, year, month, day, hour, minute] = sqlDateTime;
    date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("ar-LY", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InvoiceDetailsView({ type, movementNo, onBack, displayMovementNo, transactionDateTime, transactionDateTimeSource }: Props) {
  const query = useQuery({
    queryKey: ["accounts", "invoice", type, movementNo],
    queryFn: () => (type === "sales" ? getSalesInvoice(movementNo) : getPurchaseInvoice(movementNo)),
  });

  const errorMessage = query.error instanceof ApiError || query.error instanceof Error ? query.error.message : undefined;
  const header = query.data?.header;
  const items = query.data?.items || [];

  if (query.isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 p-2">
           <div className="h-8 w-16 bg-muted animate-pulse rounded-lg" />
           <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <LoadingState rows={5} />
      </div>
    );
  }
  
  if (query.isError || !header) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ErrorState 
          title="عذراً، تعذر تحميل الفاتورة"
          description={errorMessage || "لم يتم العثور على بيانات الفاتورة المطلوبة."} 
          onRetry={() => query.refetch()} 
        />
        {onBack && (
          <div className="mt-4 flex justify-center">
            <ActionButton label="العودة للخلف" icon={ArrowRight} onClick={onBack} variant="outline" />
          </div>
        )}
      </div>
    );
  }

  const invoiceDate = formatDate(header.date);
  const movementTime = formatTime(transactionDateTime);
  const partyLabel = type === "sales" ? "الزبون" : "المورد";

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-8">
      {/* 1. Top Navigation */}
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur-md md:mx-0 md:rounded-t-xl">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="grid size-8 place-items-center rounded-full hover:bg-secondary transition-colors"
              aria-label="رجوع"
            >
              <ArrowRight className="size-5" />
            </button>
          )}
          <h3 className="text-sm font-bold">{type === "sales" ? "فاتورة بيع" : "فاتورة شراء"}</h3>
        </div>
        <button 
          onClick={() => window.print()}
          className="grid size-9 place-items-center rounded-lg border bg-background text-muted-foreground hover:bg-secondary transition-colors"
          title="طباعة الفاتورة"
        >
          <Printer className="size-4" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {/* 2. Invoice Identity Header */}
        <div className="card-surface p-4 border-primary/10 bg-primary-soft/5">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <h1 className="text-xl font-black text-primary">
                {type === "sales" ? "فاتورة" : "فاتورة"} #{header.invoiceNo || "-"}
              </h1>
              <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                حركة #{displayMovementNo || movementNo}
              </span>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
              {invoiceDate && (
                <div className="flex items-center gap-1.5 font-bold">
                  <Calendar className="size-3.5 text-primary/70" />
                  <span>{invoiceDate}</span>
                </div>
              )}
              {movementTime && (
                <div className="flex items-center gap-1.5 font-bold" title={transactionDateTimeSource || ""}>
                  <Clock className="size-3.5 text-primary/70" />
                  <span>{movementTime}</span>
                </div>
              )}
              {header.accountLabel && (
                <div className="flex items-center gap-1.5 font-bold">
                  <Receipt className="size-3.5 text-primary/70" />
                  <span>{header.accountLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Customer / Supplier Section */}
        {header.personName && (
          <div className="card-surface px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground">{partyLabel}</p>
                <p className="truncate text-[14px] font-extrabold">{header.personName}</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[13px] font-black flex items-center gap-2">
              الأصناف
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-[10px] font-black text-primary">
                {items.length}
              </span>
            </h2>
          </div>

          <div className="divide-y divide-border border-y bg-card md:rounded-xl md:border">
            {items.map((item, index) => (
              <InvoiceItemRow key={`${item.itemNo}-${index}`} item={item} />
            ))}
          </div>
        </div>

        {/* 6. Invoice Total */}
        <div className="card-surface p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-muted-foreground">إجمالي الفاتورة</p>
              {header.notes && <p className="text-[11px] text-muted-foreground">{header.notes}</p>}
            </div>
            <div className="text-left">
              <span className="text-2xl font-black text-primary">{formatCurrency(header.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13. Mobile Sticky Total */}
      <div className="fixed bottom-[65px] left-0 right-0 z-30 border-t bg-background/95 p-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between max-w-2xl mx-auto gap-4">
           <div className="min-w-0">
             <p className="text-[10px] font-bold text-muted-foreground leading-none">الإجمالي</p>
             <div className="text-[18px] font-black text-primary">{formatCurrency(header.total)}</div>
           </div>
           <ActionButton 
            label="طباعة" 
            icon={Printer} 
            onClick={() => window.print()} 
            variant="primary"
           />
        </div>
      </div>
    </div>
  );
}

function InvoiceItemRow({ item }: { item: ApiInvoiceItemRow }) {
  return (
    <article className="flex flex-col gap-1 p-3 transition-colors hover:bg-secondary/20">
      <div className="flex justify-between items-start gap-4">
        <h4 className="text-[13px] font-extrabold leading-snug min-w-0 flex-1">
          {item.itemName}
        </h4>
        <div className="shrink-0 text-left">
          <div className="text-[14px] font-black text-foreground">
            {formatCurrency(item.total)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
        {(item.itemNo || item.barcode) && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
            <Barcode className="size-3" />
            <span>{item.barcode || item.itemNo}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
          <div className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded">
             <span className="num text-foreground">{formatNumber(item.quantity)}</span>
             <span>{item.unitName}</span>
          </div>
          <span className="text-[9px] opacity-30">×</span>
          <div className="num">
            {formatNumber(item.price)}
          </div>
        </div>
      </div>
    </article>
  );
}
