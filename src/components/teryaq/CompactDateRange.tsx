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
      <div className="min-w-[120px] flex-1">
        <label className="mb-1 block text-[11px] font-bold text-muted-foreground">من تاريخ</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onChangeFrom(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-card px-2 text-[13px] font-bold outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="min-w-[120px] flex-1">
        <label className="mb-1 block text-[11px] font-bold text-muted-foreground">إلى تاريخ</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onChangeTo(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-card px-2 text-[13px] font-bold outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <ActionButton label="تحديث" onClick={onRefresh} variant="primary" />
    </div>
  );
}
