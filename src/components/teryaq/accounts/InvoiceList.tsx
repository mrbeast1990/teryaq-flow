import { EmptyState } from "@/components/teryaq/States";
import { Link } from "@tanstack/react-router";

interface Props {
  type: "sales" | "purchase";
  accountId: string;
}

export function InvoiceList({ type, accountId }: Props) {
  // TODO: Map real invoices endpoint
  
  return (
    <div className="space-y-2">
      <EmptyState 
        title="لا توجد فواتير" 
        description={type === "sales" ? "لم يتم العثور على فواتير بيع لهذا الزبون." : "لم يتم العثور على فواتير شراء لهذا المورد."}
      />
    </div>
  );
}
