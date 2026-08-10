import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ActionButton } from "./ActionButton";

export function CompactDateRange({
  dateFrom,
  dateTo,
  onChangeFrom,
  onChangeTo,
  onRefresh,
}: {
  dateFrom: string;
  dateTo: string;
  onChangeFrom: (val: string) => void;
  onChangeTo: (val: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 px-1">
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[11px] font-bold text-muted-foreground mb-1">من تاريخ</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card px-2 text-[13px] font-bold focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[11px] font-bold text-muted-foreground mb-1">إلى تاريخ</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChangeTo(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card px-2 text-[13px] font-bold focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <ActionButton label="تحديث" onClick={onRefresh} variant="primary" />
    </div>
  );
}
