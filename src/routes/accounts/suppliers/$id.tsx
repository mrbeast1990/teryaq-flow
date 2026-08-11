import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { useState } from "react";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceList } from "@/components/teryaq/accounts/InvoiceList";
import { PaymentList } from "@/components/teryaq/accounts/PaymentList";

export const Route = createFileRoute("/accounts/suppliers/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المورد — Teryaq" },
    ],
  }),
  component: SupplierDetailsPage,
});

function SupplierDetailsPage() {
  const { id } = useParams({ from: '/accounts/suppliers/$id' });
  const [activeTab, setActiveTab] = useState("statement");

  const tabs = [
    { id: "statement", label: "كشف الحساب" },
    { id: "invoices", label: "فواتير الشراء" },
    { id: "payments", label: "السدادات" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader 
          title="تفاصيل المورد" 
          subtitle={`معرف: ${id}`} 
          showBack 
        />
        
        <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/5 p-3 border border-primary/10">
          <div className="min-w-0">
            <div className="h-5 w-32 animate-pulse rounded bg-muted/20" />
            <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted/10" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground">الرصيد الحالي</p>
            <div className="h-6 w-24 animate-pulse rounded bg-muted/20" />
          </div>
        </div>

        <div className="mt-3">
          <SegmentedTabs 
            options={tabs} 
            value={activeTab} 
            onChange={setActiveTab} 
          />
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {activeTab === "statement" && <FinancialStatement type="supplier" id={id} />}
        {activeTab === "invoices" && <InvoiceList type="purchase" accountId={id} />}
        {activeTab === "payments" && <PaymentList type="supplier" accountId={id} />}
      </div>
    </AppShell>
  );
}
