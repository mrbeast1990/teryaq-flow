import { createFileRoute } from "@tanstack/react-router";
import { Truck, Users } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { PageHeader } from "@/components/teryaq/PageHeader";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "الحسابات — Teryaq" },
      { name: "description", content: "حسابات الزبائن والموردين من Teryaq SQL Connector." },
      { property: "og:title", content: "الحسابات — Teryaq" },
      { property: "og:description", content: "حسابات الزبائن والموردين." },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <AppShell>
      <PageHeader title="الحسابات" />

      <div className="grid gap-2">
        <CompactListCard
          title="الزبائن"
          subtitle="الأرصدة، كشف الحساب، فواتير البيع، والسدادات"
          icon={Users}
          to="/accounts/customers/"
        />
        <CompactListCard
          title="الموردين"
          subtitle="الأرصدة، كشف الحساب، فواتير الشراء، والسدادات"
          icon={Truck}
          to="/accounts/suppliers/"
        />
      </div>
    </AppShell>
  );
}
