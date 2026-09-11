import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  API_BASE_URL,
  ApiError,
  getRevenueDetails,
  getRevenueMovementDetails,
  type RevenueMovementRow,
  type RevenueSellerSourceTotal,
} from "@/lib/api";

export const Route = createFileRoute("/revenue")({
  component: RevenuePage,
});

type PeriodBreakdown = {
  sellerId: number | string;
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

function sameSeller(
  source: Pick<RevenueSellerSourceTotal, "sellerId" | "sellerName">,
  period: Pick<PeriodBreakdown, "sellerId" | "periodName">,
) {
  const sourceSellerId = source.sellerId == null ? "" : String(source.sellerId);
  const periodSellerId = period.sellerId == null ? "" : String(period.sellerId);
  if (sourceSellerId && periodSellerId) return sourceSellerId === periodSellerId;
  return source.sellerName === period.periodName;
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

function buildPeriodBreakdowns(
  rows: RevenueMovementRow[],
  sellerTotals: Array<{ sellerId: number | string; sellerName: string; total: number; movementCount: number }>,
  sellerSourceTotals: RevenueSellerSourceTotal[] = [],
) {
  return sellerTotals.map<PeriodBreakdown>((period) => {
    const periodRows = rows.filter((row) => (row.period || row.sellerName) === period.sellerName);
    const movementMap = new Map<string, RevenueMovementRow[]>();

    for (const row of periodRows) {
      const sourceName = row.revenueSource || row.paymentMethod || row.movementType || "غير محدد";
      const list = movementMap.get(sourceName) ?? [];
      list.push(row);
      movementMap.set(sourceName, list);
    }

    const periodKey = { sellerId: period.sellerId, periodName: period.sellerName };
    const sources = sellerSourceTotals
      .filter((source) => sameSeller(source, periodKey))
      .map((source) => {
        const name = source.revenueSource || "غير محدد";
        return {
          name,
          total: toNumber(source.total),
          movementCount: toNumber(source.movementCount),
          movements: movementMap.get(name) ?? [],
        };
      });

    const fallbackSources = Array.from(movementMap.entries()).map(([name, movements]) => {
      return {
        name,
        total: movements.reduce((sum, row) => sum + toNumber(row.amount), 0),
        movementCount: movements.length,
        movements,
      };
    });

    const fullSources = sources.length ? sources : fallbackSources;
    const sourceTotal = fullSources.reduce((sum, source) => sum + source.total, 0);

    return {
      sellerId: period.sellerId,
      periodName: period.sellerName,
      total: toNumber(period.total),
      movementCount: toNumber(period.movementCount),
      sourceTotal,
      difference: sourceTotal - toNumber(period.total),
      sources: fullSources,
    };
  });
}

function RevenuePage() {
  const [dateFrom, setDateFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedPeriodName, setSelectedPeriodName] = useState<string | null>(null);
  const [selectedSourceName, setSelectedSourceName] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ invoiceNo: string; movementNo: string } | null>(null);
  const [highlightedInvoiceKey, setHighlightedInvoiceKey] = useState<string | null>(null);
  const invoiceModalHistoryPushed = useRef(false);

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
    () => (data ? buildPeriodBreakdowns(data.rows ?? [], data.sellerTotals ?? [], data.sellerSourceTotals ?? []) : []),
    [data],
  );

  const selectedPeriod = periodBreakdowns.find((period) => period.periodName === selectedPeriodName) ?? null;
  const selectedSource = selectedPeriod?.sources.find((source) => source.name === selectedSourceName) ?? null;
  const mismatchedPeriods = periodBreakdowns.filter((period) => Math.abs(period.difference) > 0.01);
  const selectedMovementDetails = useQuery({
    queryKey: ["revenue", "movement", invoiceModal?.movementNo],
    queryFn: () => getRevenueMovementDetails(invoiceModal?.movementNo || ""),
    enabled: Boolean(invoiceModal?.movementNo),
  });

  const handleLogin = () => {
    window.location.href = API_BASE_URL;
  };

  useEffect(() => {
    if (!highlightedInvoiceKey) return undefined;
    const timeout = window.setTimeout(() => setHighlightedInvoiceKey(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [highlightedInvoiceKey]);

  const finishCloseInvoiceModal = () => {
    if (invoiceModal) setHighlightedInvoiceKey(`${invoiceModal.movementNo}-${invoiceModal.invoiceNo}`);
    setInvoiceModal(null);
  };

  const closeInvoiceModal = () => {
    if (invoiceModalHistoryPushed.current) {
      invoiceModalHistoryPushed.current = false;
      window.history.back();
      return;
    }
    finishCloseInvoiceModal();
  };

  const openInvoiceModal = (invoice: { invoiceNo: string; movementNo: string }) => {
    setInvoiceModal(invoice);
    if (typeof window !== "undefined") {
      window.history.pushState({ teryaqRevenueInvoiceModal: true }, "");
      invoiceModalHistoryPushed.current = true;
    }
  };

  useEffect(() => {
    if (!invoiceModal) return undefined;
    const handlePopState = () => {
      invoiceModalHistoryPushed.current = false;
      finishCloseInvoiceModal();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [invoiceModal]);

  const selectedMovement = selectedMovementDetails.data?.movement;
  const selectedTransactionDateTime = selectedMovement?.movementHasRealTime ? selectedMovement.movementCreatedAt : null;

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
                          className={highlightedInvoiceKey === `${movement.movementNo}-${movement.invoiceNo}` ? "bg-primary/10 ring-2 ring-primary/30" : ""}
                          actionLabel={canOpenInvoice ? "عرض الفاتورة" : undefined}
                          onClick={
                            canOpenInvoice
                              ? () => openInvoiceModal({ invoiceNo: String(movement.invoiceNo), movementNo: String(movement.movementNo) })
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
      {invoiceModal ? (
        <div className="fixed inset-0 z-50 bg-background/85 p-3 backdrop-blur-sm print:hidden">
          <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b p-3">
              <div>
                <h2 className="text-sm font-extrabold">تفاصيل الفاتورة</h2>
                <p className="text-[11px] text-muted-foreground">تبقى صفحة الإيرادات والفلاتر كما هي بعد الإغلاق</p>
              </div>
              <ActionButton label="إغلاق" variant="outline" onClick={closeInvoiceModal} />
            </div>
            <div className="flex-1 overflow-auto p-3">
              <InvoiceDetailsView
                type="sales"
                movementNo={invoiceModal.invoiceNo}
                displayMovementNo={invoiceModal.movementNo}
                transactionDateTime={selectedTransactionDateTime || null}
                transactionDateTimeSource={selectedMovement?.movementDateTimeSource || undefined}
                onBack={closeInvoiceModal}
              />
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
