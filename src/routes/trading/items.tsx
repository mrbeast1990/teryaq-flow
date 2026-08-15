import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { useState } from "react";

export const Route = createFileRoute("/trading/items")({
  component: ItemProfitPage,
});

export function ItemProfitPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("most-profitable");

  return (
    <AppShell>
      <PageHeader 
        title="أرباح الأصناف" 
        subtitle="تحليل ربحية الأصناف وحركة المبيعات"
        showBack
      />

      <div className="mb-4 space-y-3">
        <SearchInput 
          value={search} 
          onChange={setSearch} 
          placeholder="بحث عن صنف..."
        />

        <FilterBar>
          <FilterChip 
            label="الأعلى ربحًا" 
            active={activeFilter === "most-profitable"}
            onClick={() => setActiveFilter("most-profitable")}
          />
          <FilterChip 
            label="الأقل ربحًا" 
            active={activeFilter === "least-profitable"}
            onClick={() => setActiveFilter("least-profitable")}
          />
          <FilterChip 
            label="الأعلى مبيعًا" 
            active={activeFilter === "best-selling"}
            onClick={() => setActiveFilter("best-selling")}
          />
        </FilterBar>
      </div>

      <div className="space-y-4">
        <EmptyState 
          title="لم يتم العثور على نتائج"
          description="ابحث عن صنف أو استخدم الفلاتر لتحليل الربحية."
        />
      </div>
    </AppShell>
  );
}
