/**
 * DEMO / MOCK DATA — visual development only.
 * Replace every export here with real API calls (src/lib/api) in phase 2.
 */

export const DEMO_CONNECTION = {
  name: "AlmohasebSQL",
  connected: true,
};

export type DemoKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  icon: string;
};

export const DEMO_KPIS_PRIMARY: DemoKpi[] = [
  { id: "revenue", label: "إيراد اليوم", value: "٤٫٢٨٠٫٠٠٠", hint: "ل.س", icon: "wallet", tone: "info" },
  { id: "profit", label: "أرباح اليوم", value: "٧٤٢٫٥٠٠", hint: "هامش ١٧٪", icon: "trending-up", tone: "success" },
  { id: "movements", label: "عدد الحركات", value: "١٣٨", hint: "فاتورة اليوم", icon: "receipt", tone: "default" },
  { id: "customers", label: "أرصدة الزبائن", value: "١٢٫٦٤٠٫٠٠٠", hint: "٢٤ زبون مدين", icon: "users", tone: "default" },
];

export const DEMO_KPIS_SECONDARY: DemoKpi[] = [
  { id: "suppliers", label: "مستحقات الموردين", value: "٨٫٣١٠٫٠٠٠", hint: "٩ موردين", icon: "truck", tone: "warning" },
  { id: "low", label: "مخزون منخفض", value: "٢٦", hint: "صنف", icon: "package-search", tone: "warning" },
  { id: "out", label: "أصناف نفدت", value: "٧", hint: "صنف", icon: "package-x", tone: "danger" },
  { id: "expiry", label: "قرب الانتهاء", value: "١٥", hint: "خلال ٩٠ يوم", icon: "calendar-clock", tone: "danger" },
];

export const DEMO_RECENT_MOVEMENTS = [
  { id: "1", title: "فاتورة مبيع #١٠٤٢", subtitle: "صيدلية النور", value: "٣٢٠٫٠٠٠", meta: "قبل ٥ د" },
  { id: "2", title: "فاتورة شراء #٥٥٨", subtitle: "مستودع الشام", value: "١٫١٤٠٫٠٠٠", meta: "قبل ٢٢ د" },
  { id: "3", title: "فاتورة مبيع #١٠٤١", subtitle: "زبون نقدي", value: "٨٥٫٠٠٠", meta: "قبل ٤١ د" },
];