import { ItemPartyList, type ItemPartyRow } from "./ItemPartyList";

// TODO: map real item customers endpoint after backend verification
export function ItemCustomerList({ rows = [] }: { rows?: ItemPartyRow[] }) {
  return (
    <ItemPartyList
      rows={rows}
      emptyTitle="لا يوجد عملاء لهذا الصنف"
      emptyDescription="سيتم عرض العملاء الذين تم بيع هذا الصنف لهم."
      totalLabel="إجمالي البيع"
    />
  );
}
