import { Banknote, ShoppingBag } from "lucide-react";
import type { AccountPerson } from "@/lib/api";

export function activityDate(value: string | null | undefined, now = new Date()) {
  if (value === undefined) return "تعذر التحقق من التاريخ";
  if (value === null) return null;
  // SQL business dates are calendar dates, even when serialized with a UTC suffix.
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$| )/.exec(value);
  if (!match) return "تعذر التحقق من التاريخ";
  const [, year, month, day] = match;
  const timestamp = Date.UTC(Number(year), Number(month) - 1, Number(day));
  if (new Date(timestamp).toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return "تعذر التحقق من التاريخ";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Tripoli", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const today = Date.UTC(part("year"), part("month") - 1, part("day"));
  const days = Math.round((today - timestamp) / 86400000);
  const relative = days === 0 ? "اليوم" : days === 1 ? "أمس" : days === 2 ? "منذ يومين" : days > 2 ? `منذ ${days} ${days <= 10 ? "أيام" : "يومًا"}` : "تاريخ مستقبلي";
  return `${day}/${month}/${year} · ${relative}`;
}

export function AccountActivity({ account, type }: { account: AccountPerson; type: "customer" | "supplier" }) {
  const customer = type === "customer";
  const trade = activityDate(customer ? account.lastSaleDate : account.lastPurchaseDate);
  const payment = activityDate(customer ? account.lastCollectionDate : account.lastPaymentDate);
  return (
    <div className="mt-1 flex flex-col gap-1 text-[11px] leading-5" dir="rtl">
      <p className={`flex items-start gap-1 text-blue-700 ${customer ? "order-2" : "order-1"}`}>
        <ShoppingBag aria-hidden="true" className="mt-1 size-3 shrink-0" />
        <span className="min-w-0 break-words">{trade === null ? (customer ? "لا توجد مبيعات" : "لا توجد مشتريات") : `${customer ? "آخر بيع" : "آخر شراء"}: ${trade}`}</span>
      </p>
      <p className={`flex items-start gap-1 ${customer ? "order-1 font-bold text-foreground" : "order-2 text-emerald-700"}`}>
        <Banknote aria-hidden="true" className="mt-1 size-3 shrink-0" />
        <span className="min-w-0 break-words">{payment === null ? (customer ? "لا توجد تحصيلات" : "لا توجد سدادات") : `${customer ? "آخر تحصيل" : "آخر سداد"}: ${payment}`}</span>
      </p>
    </div>
  );
}
