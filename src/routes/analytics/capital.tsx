import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/teryaq/AppShell";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { EmptyState } from "@/components/teryaq/States";
import { Wallet, Info } from "lucide-react";

export const Route = createFileRoute("/analytics/capital")({
  head: () => ({
    meta: [
      { title: "رأس المال والبضاعة — Teryaq" },
    ],
  }),
  component: CapitalGoodsPage,
});

function CapitalGoodsPage() {
  return (
    <AppShell>
      <PageHeader
        title="رأس المال والبضاعة"
        subtitle="تقدير قيمة المخزون ورأس المال المستثمر"
      />

      <div className="mb-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        <div className="flex gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            يتم تقدير هذه القيم بناءً على آخر أسعار شراء مسجلة وكميات المخزون الحالية.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <EmptyState
          title="لا توجد بيانات"
          description="سيتم عرض تفاصيل رأس المال والبضاعة هنا عند توفرها من النظام."
          icon={Wallet}
        />
        
        {/* 
          Future Sections:
          - قيمة البضاعة بسعر الشراء
          - قيمة البضاعة بسعر البيع
          - تقدير رأس المال
        */}
      </div>
    </AppShell>
  );
}
