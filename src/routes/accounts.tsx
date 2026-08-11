import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Truck } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { CompactListCard } from "@/components/teryaq/CompactListCard";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "الحسابات — Teryaq" },
      { name: "description", content: "إدارة حسابات الزبائن والموردين في Teryaq Flow." },
      { property: "og:title", content: "الحسابات — Teryaq" },
      { property: "og:description", content: "إدارة حسابات الزبائن والموردين." },
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
          subtitle="إدارة حسابات الزبائن" 
          icon={Users} 
          to="/accounts/customers"
        />
        <CompactListCard 
          title="الموردين" 
          subtitle="إدارة حسابات الموردين" 
          icon={Truck} 
          to="/accounts/suppliers"
        />
      </div>
    </AppShell>
  );
}
