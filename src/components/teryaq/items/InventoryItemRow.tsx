import type { LucideIcon } from "lucide-react";
import { StatusBadge, type StatusTone } from "../StatusBadge";

interface Props {
  name: string;
  code?: string;
  barcode?: string;
  formattedQuantity?: string;
  rawQuantity?: number;
  purchasePrice?: number;
  salePrice?: number;
  expiryStatus?: "valid" | "near" | "expired";
  expiryDate?: string;
  onClick?: () => void;
}

function formatCurrency(value?: number) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

export function InventoryItemRow({
  name,
  code,
  barcode,
  formattedQuantity,
  purchasePrice,
  salePrice,
  expiryStatus,
  expiryDate,
  onClick,
}: Props) {
  const expiryTone: Record<string, StatusTone> = {
    valid: "success",
    near: "warning",
    expired: "danger",
  };

  const expiryLabel: Record<string, string> = {
    valid: "ساري",
    near: "قريب الانتهاء",
    expired: "منتهي",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-surface flex w-full flex-col gap-2 p-3 text-right transition-colors hover:bg-secondary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-extrabold">{name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {code ? `كود: ${code}` : ""}
            {code && barcode ? " · " : ""}
            {barcode ? `باركود: ${barcode}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p className="num text-[14px] font-extrabold text-primary">{formattedQuantity || "-"}</p>
          <p className="text-[11px] text-muted-foreground">الكمية</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-2">
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">شراء</p>
            <p className="num text-[12px] font-bold">{formatCurrency(purchasePrice)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">بيع</p>
            <p className="num text-[12px] font-bold">{formatCurrency(salePrice)}</p>
          </div>
        </div>
        {expiryStatus && (
          <div className="flex items-center gap-2">
            {expiryDate && <span className="text-[11px] text-muted-foreground">{expiryDate}</span>}
            <StatusBadge label={expiryLabel[expiryStatus]} tone={expiryTone[expiryStatus]} />
          </div>
        )}
      </div>
    </button>
  );
}
