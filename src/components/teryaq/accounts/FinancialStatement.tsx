import { EmptyState } from "@/components/teryaq/States";

interface Props {
  type: "customer" | "supplier";
  id: string;
}

export function FinancialStatement({ type, id }: Props) {
  // TODO: Map real statement endpoint after Codex verification
  
  return (
    <div className="space-y-2">
      {/* Table Header for Desktop */}
      <div className="hidden sm:grid grid-cols-5 gap-2 px-3 py-2 text-[11px] font-bold text-muted-foreground border-b border-border">
        <div>التاريخ</div>
        <div>البيان</div>
        <div className="text-left">مدين</div>
        <div className="text-left">دائن</div>
        <div className="text-left">الرصيد</div>
      </div>

      {/* Mobile view and actual list */}
      <EmptyState 
        title="لا توجد حركات في كشف الحساب" 
        description="سيتم عرض العمليات المالية هنا بمجرد توفر البيانات من النظام."
      />
    </div>
  );
}
