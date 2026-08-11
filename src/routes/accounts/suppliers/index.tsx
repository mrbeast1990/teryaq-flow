import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { FilterBar, FilterChip } from "@/components/teryaq/FilterBar";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { EmptyState, LoadingState } from "@/components/teryaq/States";
import { FileDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// TODO: Map real suppliers endpoint after Codex verification

export const Route = createFileRoute("/accounts/suppliers/")({
  head: () => ({
    meta: [
      { title: "الموردين — Teryaq" },
    ],
  }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { isLoading, data, refetch } = useQuery({
    queryKey: ['suppliers', filter, search],
    queryFn: async () => null,
    enabled: false
  });

  const filterOptions = [
    { id: "all", label: "الجميع" },
    { id: "hasBalance", label: "لهم رصيد" },
    { id: "zeroBalance", label: "رصيد صفر" },
    { id: "archived", label: "المؤرشف" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader 
          title="الموردين" 
          showBack 
          actions={
            <div className="flex gap-1">
              <ActionButton label="تصدير" icon={FileDown} onClick={() => {}} disabled variant="outline" />
              <ActionButton label="تحديث" icon={RefreshCw} onClick={() => { refetch(); }} variant="outline" />
            </div>
          }
        />
        <div className="mt-2 space-y-2">
          <SearchInput 
            placeholder="اسم المورد، رقم الهاتف..." 
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <FilterBar>
            {filterOptions.map(opt => (
              <FilterChip 
                key={opt.id}
                label={opt.label}
                active={filter === opt.id}
                onClick={() => setFilter(opt.id)}
              />
            ))}
          </FilterBar>
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {isLoading ? (
          <LoadingState />
        ) : !data ? (
          <EmptyState 
            title="لا توجد بيانات لعرضها" 
            description="سيتم تحميل قائمة الموردين من النظام بمجرد ربط الـ API."
          />
        ) : (
          <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border/50">
          </div>
        )}
      </div>
    </AppShell>
  );
}
