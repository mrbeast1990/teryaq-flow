import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { SegmentedTabs } from "@/components/teryaq/SegmentedTabs";
import { LoadingState } from "@/components/teryaq/States";
import { FinancialStatement } from "@/components/teryaq/accounts/FinancialStatement";
import { InvoiceList } from "@/components/teryaq/accounts/InvoiceList";
import { PaymentList } from "@/components/teryaq/accounts/PaymentList";
import { getCustomerDetails, getCustomerLedger, getCustomers } from "@/lib/api";

export const Route = createFileRoute("/accounts/customers/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل الزبون — Teryaq" }],
  }),
  component: CustomerDetailsPage,
});

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("ar-LY", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function balanceClass(value?: number | null) {
  const balance = Number(value || 0);
  if (balance > 0) return "text-success";
  if (balance < 0) return "text-destructive";
  return "";
}

function CustomerDetailsPage() {
  const { id } = useParams({ from: "/accounts/customers/$id" });
  const [activeTab, setActiveTab] = useState("statement");

  const detailsQuery = useQuery({
    queryKey: ["accounts", "customer", id, "details"],
    queryFn: () => getCustomerDetails(id),
  });
  const customersQuery = useQuery({
    queryKey: ["accounts", "customers"],
    queryFn: () => getCustomers(),
  });
  const ledgerQuery = useQuery({
    queryKey: ["accounts", "customer", id, "ledger", "summary"],
    queryFn: () => getCustomerLedger(id),
  });

  const listCustomer = customersQuery.data?.customers?.find((item) => String(item.id) === String(id));
  const customer = detailsQuery.data?.customer;
  const balance = listCustomer?.currentBalance ?? ledgerQuery.data?.rows?.[0]?.runningBalance ?? 0;
  const name = customer?.name || listCustomer?.name || `زبون ${id}`;
  const phone = customer?.phone || listCustomer?.phone || "هاتف غير مسجل";

  const tabs = [
    { id: "statement", label: "كشف الحساب" },
    { id: "invoices", label: "فواتير البيع" },
    { id: "payments", label: "السدادات" },
  ];

  return (
    <AppShell>
      <div className="sticky top-0 z-20 mb-2 bg-background/80 px-1 pb-2 pt-1 backdrop-blur-md">
        <PageHeader title="تفاصيل الزبون" subtitle={`معرف: ${id}`} showBack />

        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/10 bg-primary/5 p-3">
          {detailsQuery.isLoading && !customer ? (
            <div className="w-full">
              <LoadingState rows={1} />
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{name}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{phone}</p>
              </div>
              <div className="shrink-0 text-left">
                <p className="text-[10px] text-muted-foreground">الرصيد الحالي</p>
                <p className={`num text-base font-extrabold ${balanceClass(balance)}`}>{formatNumber(balance)}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-3">
          <SegmentedTabs options={tabs} value={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="mt-2 min-h-[40vh]">
        {activeTab === "statement" && (
          <div className="space-y-2">
            <div className="no-print flex justify-end">
              <ActionButton label="طباعة كشف الحساب" icon={Printer} onClick={() => window.print()} variant="outline" />
            </div>
            <FinancialStatement type="customer" id={id} accountName={name} accountPhone={phone} currentBalance={balance} />
          </div>
        )}
        {activeTab === "invoices" && <InvoiceList type="sales" accountId={id} />}
        {activeTab === "payments" && <PaymentList type="customer" accountId={id} />}
      </div>
    </AppShell>
  );
}
