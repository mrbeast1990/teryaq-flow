import { ItemPartyList, type ItemPartyRow } from "./ItemPartyList";

// TODO: map real item suppliers endpoint after backend verification
export function ItemSupplierList({ rows = [] }: { rows?: ItemPartyRow[] }) {
  return (
    <ItemPartyList
      rows={rows}
      emptyTitle="لا يوجد موردون لهذا الصنف"
      emptyDescription="سيتم عرض الموردين الذين تم الشراء منهم لهذا الصنف."
      totalLabel="إجمالي الشراء"
    />
  );
}
