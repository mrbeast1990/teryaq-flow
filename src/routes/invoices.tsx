import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { LoadingState } from "@/components/teryaq/States";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [{ title: "تحويل مركز الفواتير - Teryaq" }],
  }),
  component: LegacyInvoiceRedirect,
});

function LegacyInvoiceRedirect() {
  useEffect(() => {
    window.location.replace("/payments?tab=purchase-invoices");
  }, []);

  return (
    <AppShell>
      <PageHeader title="مركز الفواتير" subtitle="تم نقل فواتير الشراء إلى صفحة المقبوضات والسدادات." />
      <LoadingState label="جاري فتح فواتير الشراء..." />
    </AppShell>
  );
}
