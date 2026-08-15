import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { History } from "lucide-react";
import { FilterBar } from "@/components/teryaq/FilterBar";
import { useState } from "react";

export const Route = createFileRoute("/analytics/prices")({
  head: () => ({
    meta: [
      { title: "مراقبة أسعار الشراء — Teryaq" },
    ],
  }),
  component: PriceMonitoringPage,
});

function PriceMonitoringPage() {
  const [search, setSearch] = useState("");

  return (
    <AppShell>
      <PageHeader
        title="مراقبة أسعار الشراء"
        subtitle="تتبع تغيرات أسعار التكلفة من الموردين"
      />

      <FilterBar
        searchPlaceholder="ابحث عن صنف أو مورد..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="mt-6">
        <EmptyState
          title="لا توجد بيانات"
          description="سيتم عرض تغيرات أسعار الشراء هنا بمجرد توفر البيانات من النظام."
          icon={History}
        />

        {/* 
          Future Row Fields:
          - اسم الصنف
          - المورد
          - السعر السابق
          - السعر الأخير
          - مقدار التغير
          - تاريخ آخر شراء
        */}
      </div>
    </AppShell>
  );
}
