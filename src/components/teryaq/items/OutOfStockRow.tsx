import { InventoryItemRow } from "./InventoryItemRow";
import type { ComponentProps } from "react";

export function OutOfStockRow(props: Omit<ComponentProps<typeof InventoryItemRow>, "expiryStatus" | "expiryDate">) {
  return <InventoryItemRow {...props} formattedQuantity={props.formattedQuantity || "0"} />;
}
