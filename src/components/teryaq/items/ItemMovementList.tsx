import { EmptyState } from "../States";
import { ItemMovementRow, type ItemMovementRowProps } from "./ItemMovementRow";

// TODO: map real item movement log endpoint after backend verification
export function ItemMovementList({ rows = [] }: { rows?: ItemMovementRowProps[] }) {
  if (!rows.length) {
    return <EmptyState title="لا توجد حركات" description="لا يوجد سجل حركات لهذا الصنف." />;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <ItemMovementRow key={`${row.date}-${index}`} {...row} />
      ))}
    </div>
  );
}
