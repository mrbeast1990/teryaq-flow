import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/trading/daily")({
  component: DailyProfitPage,
});

function DailyProfitPage() {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <AppShell>
      <PageHeader 
        title="أرباح الأيام" 
        subtitle="مراجعة نتائج المتاجرة والربحية حسب اليوم"
        showBack
      />

      <div className="mb-6">
        <CompactDateRange 
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeFrom={setDateFrom}
          onChangeTo={setDateTo}
          onRefresh={() => {}}
        />
      </div>

      <div className="space-y-4">
        <EmptyState 
          title="لا توجد بيانات"
          description="يرجى اختيار فترة زمنية لعرض تقرير أرباح الأيام."
        />
      </div>
    </AppShell>
  );
}
