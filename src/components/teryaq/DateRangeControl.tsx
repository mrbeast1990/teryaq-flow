import { CalendarDays } from "lucide-react";
import { SegmentedTabs } from "./SegmentedTabs";

export const DATE_RANGES = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "الأسبوع" },
  { id: "month", label: "الشهر" },
];

export function DateRangeControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
      <span className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
        <CalendarDays className="size-4" />
      </span>
      <SegmentedTabs options={DATE_RANGES} value={value} onChange={onChange} />
    </div>
  );
}