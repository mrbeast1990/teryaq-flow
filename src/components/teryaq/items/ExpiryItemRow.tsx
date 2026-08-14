import { InventoryItemRow } from "./InventoryItemRow";
import type { ComponentProps } from "react";

export function ExpiryItemRow(props: ComponentProps<typeof InventoryItemRow>) {
  return <InventoryItemRow {...props} />;
}
