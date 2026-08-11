import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { EmptyState } from "@/components/teryaq/States";
import { useState } from "react";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceList } from "@/components/teryaq/accounts/InvoiceList";
import { PaymentList } from "@/components/teryaq/accounts/PaymentList";

export const Route = createFileRoute("/accounts/customers/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الزبون — Teryaq" },
    ],
  }),
  component: CustomerDetailsPage,
});

function CustomerDetailsPage() {
  const { id } = useParams({ from: '/accounts/customers/$id' });
  const [activeTab, setActiveTab] = useState("statement");

  const tabs = [
    { id: "statement", label: "كشف الحساب" },
    { id: "invoices", label: "فواتير البيع" },
    { id: "payments", label: "السدادات" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader 
          title="تفاصيل الزبون" 
          subtitle={`معرف: ${id}`} 
          showBack 
        />
        
        <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/5 p-3 border border-primary/10">
          <div className="min-w-0">
            <div className="h-5 w-32 animate-pulse rounded bg-muted/20" /> {/* Name placeholder */}
            <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted/10" /> {/* Phone placeholder */}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground">الرصيد الحالي</p>
            <div className="h-6 w-24 animate-pulse rounded bg-muted/20" /> {/* Balance placeholder */}
          </div>
        </div>

        <div className="mt-3">
          <SegmentedTabs 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {activeTab === "statement" && <FinancialStatement type="customer" id={id} />}
        {activeTab === "invoices" && <InvoiceList type="sales" accountId={id} />}
        {activeTab === "payments" && <PaymentList type="customer" accountId={id} />}
      </div>
    </AppShell>
  );
}
