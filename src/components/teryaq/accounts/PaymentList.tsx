import { EmptyState } from "@/components/teryaq/States";

interface Props {
  type: "customer" | "supplier";
  accountId: string;
}

export function PaymentList({ type, accountId }: Props) {
  // TODO: Map real payments endpoint
  
  return (
    <div className="space-y-2">
      <EmptyState 
        title="لا توجد سدادات" 
        description="لم يتم تسجيل أي عمليات دفع أو سداد لهذا الحساب."
      />
    </div>
  );
}
