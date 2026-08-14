import { EmptyState } from "../States";
import { ItemMovementRow, type ItemMovementRowProps } from "./ItemMovementRow";

// TODO: map real item purchase movements endpoint after backend verification
export function PurchaseMovementList({ rows = [] }: { rows?: ItemMovementRowProps[] }) {
  if (!rows.length) {
    return <EmptyState title="لا توجد عمليات شراء" description="لم يتم العثور على فواتير شراء لهذا الصنف." />;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <ItemMovementRow key={`${row.date}-${index}`} {...row} amountLabel="إجمالي الشراء" />
      ))}
    </div>
  );
}
