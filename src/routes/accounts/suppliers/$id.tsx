import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceList } from "@/components/teryaq/accounts/InvoiceList";
import { PaymentList } from "@/components/teryaq/accounts/PaymentList";
import { getSupplierLedger, getSuppliers } from "@/lib/api";

export const Route = createFileRoute("/accounts/suppliers/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل المورد — Teryaq" }],
  }),
  component: SupplierDetailsPage,
});

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function SupplierDetailsPage() {
  const { id } = useParams({ from: "/accounts/suppliers/$id" });
  const [activeTab, setActiveTab] = useState("statement");

  const suppliersQuery = useQuery({
    queryKey: ["accounts", "suppliers"],
    queryFn: () => getSuppliers(),
  });
  const ledgerQuery = useQuery({
    queryKey: ["accounts", "supplier", id, "ledger", "summary"],
    queryFn: () => getSupplierLedger(id),
  });

  const supplier = suppliersQuery.data?.suppliers?.find((item) => String(item.id) === String(id));
  const balance = supplier?.currentBalance ?? ledgerQuery.data?.rows?.[0]?.runningBalance ?? 0;

  const tabs = [
    { id: "statement", label: "كشف الحساب" },
    { id: "invoices", label: "فواتير الشراء" },
    { id: "payments", label: "السدادات" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 -mx-4 mb-2 bg-background/80 px-4 pb-2 pt-1 backdrop-blur-md">
        <PageHeader title="تفاصيل المورد" subtitle={`معرف: ${id}`} showBack />

        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{supplier?.name || `مورد ${id}`}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{supplier?.phone || "هاتف غير مسجل"}</p>
          </div>
          <div className="shrink-0 text-left">
            <p className="text-[10px] text-muted-foreground">الرصيد الحالي</p>
            <p className="num text-base font-extrabold">{formatNumber(balance)}</p>
          </div>
        </div>

        <div className="mt-3">
          <SegmentedTabs options={tabs} value={activeTab} onChange={setActiveTab} />
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
