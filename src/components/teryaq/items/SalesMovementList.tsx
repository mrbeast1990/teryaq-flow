import { EmptyState } from "../States";
import { ItemMovementRow, type ItemMovementRowProps } from "./ItemMovementRow";

// TODO: map real item sales movements endpoint after backend verification
export function SalesMovementList({ rows = [] }: { rows?: ItemMovementRowProps[] }) {
  if (!rows.length) {
    return <EmptyState title="لا توجد عمليات بيع" description="لم يتم العثور على فواتير بيع لهذا الصنف." />;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <ItemMovementRow key={`${row.date}-${index}`} {...row} amountLabel="إجمالي البيع" />
      ))}
    </div>
  );
}
