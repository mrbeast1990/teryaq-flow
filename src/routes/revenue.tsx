import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, LogIn, Receipt, RotateCcw, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/teryaq/AppShell";
import { ActionButton } from "@/components/teryaq/ActionButton";
import { CompactDateRange } from "@/components/teryaq/CompactDateRange";
import { CompactListCard } from "@/components/teryaq/CompactListCard";
import { KPIGrid } from "@/components/teryaq/KPIGrid";
import { KPICard } from "@/components/teryaq/KPICard";
import { PageHeader } from "@/components/teryaq/PageHeader";
import { StatusBadge } from "@/components/teryaq/StatusBadge";
import { ErrorState, LoadingState } from "@/components/teryaq/States";
import { InvoiceDetailsView } from "@/components/teryaq/accounts/InvoiceDetailsView";
import { API_BASE_URL, ApiError, getRevenueDetails, getRevenueMovementDetails, type RevenueMovementRow } from "@/lib/api";

export const Route = createFileRoute("/revenue")({
  component: RevenuePage,
});

type PeriodBreakdown = {
  periodName: string;
  total: number;
  movementCount: number;
  sourceTotal: number;
  difference: number;
  sources: Array<{
    name: string;
    total: number;
    movementCount: number;
    movements: RevenueMovementRow[];
  }>;
};

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("ar-LY", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ar-LY");
}

function isSalesInvoiceMovement(movement: RevenueMovementRow) {
  const source = movement.revenueSource || "";
  const type = movement.movementType || "";
  const invoiceNo = movement.invoiceNo == null ? "" : String(movement.invoiceNo);
  if (!invoiceNo || invoiceNo === "0") return false;
  if (Number(movement.amount) <= 0) return false;
  if (source.includes("مردود") || type.includes("مردود")) return false;
  if (source.includes("سداد") || type.includes("سداد")) return false;
  return true;
}

function buildPeriodBreakdowns(rows: RevenueMovementRow[], sellerTotals: Array<{ sellerName: string; total: number; movementCount: number }>) {
  return sellerTotals.map<PeriodBreakdown>((period) => {
    const periodRows = rows.filter((row) => (row.period || row.sellerName) === period.sellerName);
    const sourceMap = new Map<string, RevenueMovementRow[]>();

    for (const row of periodRows) {
      const sourceName = row.revenueSource || row.paymentMethod || row.movementType || "غير محدد";
      const list = sourceMap.get(sourceName) ?? [];
      list.push(row);
      sourceMap.set(sourceName, list);
    }

    const sources = Array.from(sourceMap.entries()).map(([name, movements]) => {
      const total = movements.reduce((sum, row) => sum + toNumber(row.amount), 0);
      return {
        name,
        total,
        movementCount: movements.length,
        movements,
      };
    });

    const sourceTotal = sources.reduce((sum, source) => sum + source.total, 0);

    return {
      periodName: period.sellerName,
      total: toNumber(period.total),
      movementCount: toNumber(period.movementCount),
      sourceTotal,
      difference: sourceTotal - toNumber(period.total),
      sources,
    };
  });
}

function RevenuePage() {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedPeriodName, setSelectedPeriodName] = useState<string | null>(null);
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{ invoiceNo: string; movementNo: string } | null>(null);

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: ["revenue", { dateFrom, dateTo }],
    queryFn: () => getRevenueDetails({ dateFrom, dateTo }),
    retry: (failureCount, error: unknown) => {
      if (error instanceof ApiError && error.type === "AUTH_REQUIRED") return false;
      return failureCount < 2;
    },
  });

  const apiError = error as ApiError | null;
  const isAuthRequired = apiError?.type === "AUTH_REQUIRED";

  const periodBreakdowns = useMemo(
    () => (data ? buildPeriodBreakdowns(data.rows ?? [], data.sellerTotals ?? []) : []),
    [data],
  );

  const selectedPeriod = periodBreakdowns.find((period) => period.periodName === selectedPeriodName) ?? null;
  const selectedSource = selectedPeriod?.sources.find((source) => source.name === selectedSourceName) ?? null;
  const mismatchedPeriods = periodBreakdowns.filter((period) => Math.abs(period.difference) > 0.01);
  const selectedMovementDetails = useQuery({
    queryKey: ["revenue", "movement", selectedInvoice?.movementNo],
    queryFn: () => getRevenueMovementDetails(selectedInvoice?.movementNo || ""),
    enabled: Boolean(selectedInvoice?.movementNo),
  });

  const handleLogin = () => {
    window.location.href = API_BASE_URL;
  };

  if (selectedInvoice) {
    const movement = selectedMovementDetails.data?.movement;
    const transactionDateTime = movement?.movementHasRealTime ? movement.movementCreatedAt : null;
    return (
      <AppShell>
        <PageHeader title="تفاصيل الفاتورة" subtitle="بيانات الفاتورة الحقيقية من Teryaq SQL Connector" />
        <InvoiceDetailsView
          type="sales"
          movementNo={selectedInvoice.invoiceNo}
          displayMovementNo={selectedInvoice.movementNo}
          transactionDateTime={transactionDateTime}
          transactionDateTimeSource={movement?.movementDateTimeSource || undefined}
          onBack={() => setSelectedInvoice(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="إيراد اليوم" subtitle="بيانات حقيقية من Teryaq SQL Connector" />

      {isAuthRequired ? (
        <div className="card-surface flex flex-col items-center gap-4 p-8 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-warning/10 text-warning">
            <LogIn className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">يتطلب تسجيل الدخول</h3>
            <p className="text-sm text-muted-foreground">
              يرجى تسجيل الدخول عبر Cloudflare Access للوصول إلى بيانات Teryaq.
            </p>
          </div>
          <ActionButton label="تسجيل الدخول الآن" onClick={handleLogin} variant="primary" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <CompactDateRange
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChangeFrom={(value) => {
                setDateFrom(value);
                setSelectedPeriodName(null);
                setSelectedSourceName(null);
              }}
              onChangeTo={(value) => {
                setDateTo(value);
                setSelectedPeriodName(null);
                setSelectedSourceName(null);
              }}
              onRefresh={() => refetch()}
            />
          </div>

          {isLoading ? (
            <LoadingState rows={4} />
          ) : isError ? (
            <ErrorState description={apiError?.message || "تعذر تحميل تفاصيل الإيرادات."} onRetry={() => refetch()} />
          ) : data ? (
            <div className="space-y-5">
              <KPIGrid>
                <KPICard label="صافي الإيراد" value={formatMoney(data.summary.netRevenue)} icon={Wallet} tone="info" />
                <KPICard
                  label="المبيعات النقدية"
                  value={formatMoney(data.summary.cashSalesTotal)}
                  icon={Receipt}
                  tone="success"
                />
                <KPICard
                  label="المدفوعات الإلكترونية"
                  value={formatMoney(data.summary.electronicPaymentsTotal)}
                  icon={CreditCard}
                  tone="info"
                />
                <KPICard
                  label="سداد المدينين"
                  value={formatMoney(data.summary.debtorPaymentsTotal)}
                  icon={Users}
                  tone="warning"
                />
                <KPICard
                  label="المردودات"
                  value={formatMoney(-Math.abs(data.summary.returnsTotal))}
                  icon={RotateCcw}
                  tone="danger"
                />
                <KPICard
                  label="عدد الحركات"
                  value={data.summary.movementCount.toLocaleString("ar-LY")}
                  icon={Receipt}
                  tone="default"
                />
              </KPIGrid>

              {mismatchedPeriods.length > 0 ? (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-[12px] font-semibold text-warning">
                  يوجد عدم تطابق بين إجمالي فترة ومجموع مصادرها. لم يتم إخفاء الفرق في الواجهة.
                </div>
              ) : null}

              <section className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-extrabold">الفترات</h2>
                  <StatusBadge label={`${periodBreakdowns.length.toLocaleString("ar-LY")} فترة`} tone="info" />
                </div>
                <div className="space-y-2">
                  {periodBreakdowns.map((period) => {
                    const selected = selectedPeriodName === period.periodName;
                    const hasMismatch = Math.abs(period.difference) > 0.01;
                    return (
                      <button
                        key={period.periodName}
                        type="button"
                        onClick={() => {
                          setSelectedPeriodName(period.periodName);
                          setSelectedSourceName(null);
                        }}
                        className={`card-surface w-full p-3 text-right transition-colors ${
                          selected ? "ring-2 ring-primary" : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-extrabold">{period.periodName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {period.movementCount.toLocaleString("ar-LY")} حركة
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="num text-[17px] font-extrabold">{formatMoney(period.total)}</p>
                            {hasMismatch ? (
                              <p className="text-[11px] font-bold text-warning">
                                فرق مصادر: {formatMoney(period.difference)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {selectedPeriod ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-extrabold">مصادر الإيراد: {selectedPeriod.periodName}</h2>
                    <ActionButton label="رجوع للفترات" variant="ghost" onClick={() => setSelectedPeriodName(null)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPeriod.sources.map((source) => (
                      <button
                        key={source.name}
                        type="button"
                        onClick={() => setSelectedSourceName(source.name)}
                        className={`card-surface p-3 text-right transition-colors ${
                          selectedSourceName === source.name ? "ring-2 ring-primary" : "hover:bg-secondary/50"
                        }`}
                      >
                        <p className="truncate text-[12px] font-bold text-muted-foreground">{source.name}</p>
                        <p className={`num text-[17px] font-extrabold ${source.total < 0 ? "text-destructive" : ""}`}>
                          {formatMoney(source.total)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {source.movementCount.toLocaleString("ar-LY")} حركة
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {selectedSource ? (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-extrabold">تفاصيل الحركات: {selectedSource.name}</h2>
                    <StatusBadge label={`${selectedSource.movements.length.toLocaleString("ar-LY")} حركة`} tone="neutral" />
                  </div>
                  <div className="space-y-2">
                    {selectedSource.movements.map((movement) => {
                      const canOpenInvoice = isSalesInvoiceMovement(movement);
                      return (
                        <CompactListCard
                          key={`${movement.movementNo}-${movement.invoiceNo}-${movement.amount}`}
                          title={`${movement.movementType} | ${formatShortDate(movement.movementDate)}`}
                          subtitle={`العميل: ${movement.customerName || "غير محدد"} | حركة #${movement.movementNo} | فاتورة #${movement.invoiceNo}`}
                          value={formatMoney(movement.amount)}
                          meta={movement.paymentMethod}
                          actionLabel={canOpenInvoice ? "عرض الفاتورة" : undefined}
                          onClick={
                            canOpenInvoice
                              ? () => setSelectedInvoice({ invoiceNo: String(movement.invoiceNo), movementNo: String(movement.movementNo) })
                              : undefined
                          }
                          icon={Receipt}
                        />
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
