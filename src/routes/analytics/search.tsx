import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState } from "@/components/teryaq/States";
import { Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/analytics/search")({
  head: () => ({
    meta: [
      { title: "البحث الشامل — Teryaq" },
    ],
  }),
  component: GlobalSearchPage,
});

function GlobalSearchPage() {
  const [query, setQuery] = useState("");

  return (
    <AppShell>
      <PageHeader
        title="البحث الشامل"
        subtitle="البحث في الأصناف، الزبائن، الموردين والفواتير"
      />

      <div className="sticky top-0 z-10 -mx-4 mb-6 bg-slate-50/80 px-4 py-3 backdrop-blur-sm dark:bg-slate-900/80">
        <SearchInput
          placeholder="ابحث عن أي شيء..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {!query ? (
          <EmptyState
            title="ابدأ البحث الآن"
            description="يمكنك البحث عن الأصناف، الزبائن، الموردين أو أرقام الفواتير والحركات."
            icon={Search}
          />
        ) : (
          <div className="space-y-8">
            {/* 
              Future Result Categories:
              - الأصناف
              - الزبائن
              - الموردين
              - فواتير البيع
              - فواتير الشراء
              - الحركات
            */}
            <EmptyState
              title="لا توجد نتائج"
              description={`لم يتم العثور على أي نتائج للبحث عن "${query}"`}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
