import { createFileRoute } from "@tanstack/react-router";
import { Users, Truck } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SectionHeader } from "@/components/teryaq/SectionHeader";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { SearchInput } from "@/components/teryaq/SearchInput";
import { EmptyState } from "@/components/teryaq/States";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "الحسابات — Teryaq" },
      { name: "description", content: "حسابات الزبائن والموردين وأرصدتهم في Teryaq." },
      { property: "og:title", content: "الحسابات — Teryaq" },
      { property: "og:description", content: "حسابات الزبائن والموردين وأرصدتهم." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <AppShell>
      <PageHeader title="الحسابات" subtitle="هيكل التنقل — المرحلة الأولى" />
      <div className="mb-3">
        <SearchInput placeholder="بحث في الحسابات…" />
      </div>
      <SectionHeader title="الأقسام" />
      <div className="grid gap-2 sm:grid-cols-2">
        <CompactListCard title="الزبائن" subtitle="أرصدة ومستحقات الزبائن" icon={Users} />
        <CompactListCard title="الموردين" subtitle="مستحقات الموردين" icon={Truck} />
      </div>
      <div className="mt-4">
        <EmptyState
          title="لم يتم ربط البيانات بعد"
          description="ستظهر قوائم الزبائن والموردين بعد ربط الـ API."
        />
      </div>
    </AppShell>
  );
}