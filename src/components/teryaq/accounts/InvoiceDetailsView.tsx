import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { EmptyState } from "@/components/teryaq/States";
import { Printer, ArrowRight } from "lucide-react";

interface Props {
  type: "sales" | "purchase";
  movementNo: string;
  onBack?: () => void;
}

export function InvoiceDetailsView({ type, movementNo, onBack }: Props) {
  // TODO: Map real invoice details endpoint
  // API_ENDPOINTS.salesInvoice(movementNo) or API_ENDPOINTS.purchaseInvoice(movementNo)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-bold">
            {type === "sales" ? "فاتورة بيع" : "فاتورة شراء"}
          </h3>
          <p className="text-[11px] text-muted-foreground">رقم الحركة: {movementNo}</p>
        </div>
        <div className="flex gap-1">
          <ActionButton icon={Printer} onClick={() => {}} variant="outline" />
        </div>
      </div>

      {/* Invoice Header Details Placeholder */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/10 p-3 text-[12px]">
        <div className="space-y-1">
          <p className="text-muted-foreground">رقم الفاتورة</p>
          <div className="h-4 w-16 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">التاريخ</p>
          <div className="h-4 w-24 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground">{type === "sales" ? "الزبون" : "المورد"}</p>
          <div className="h-4 w-32 animate-pulse rounded bg-muted/20" />
        </div>
        <div className="space-y-1 text-left">
          <p className="text-muted-foreground">الإجمالي</p>
          <div className="h-4 w-20 animate-pulse rounded bg-muted/20 ml-auto" />
        </div>
      </div>

      {/* Items List Header */}
      <div className="mt-4">
        <p className="mb-2 text-[13px] font-bold">الأصناف</p>
        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border pb-2 text-[11px] font-bold text-muted-foreground">
          <div>اسم الصنف</div>
          <div className="text-left">الكمية</div>
          <div className="text-left">السعر</div>
          <div className="text-left">الإجمالي</div>
        </div>
        
        <EmptyState 
          title="لا توجد أصناف" 
          description="سيتم تحميل تفاصيل الفاتورة عند توفر البيانات."
        />
      </div>
    </div>
  );
}
