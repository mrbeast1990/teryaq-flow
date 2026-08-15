import { TrendingUp, BarChart3, Package, Calendar } from "lucide-react";
import { CompactListCard } from "../CompactListCard";
import { SectionHeader } from "../SectionHeader";

export function TradingNav() {
  const items = [
    {
      title: "المتاجرة والأرباح",
      subtitle: "نظرة عامة على الأداء المالي",
      icon: TrendingUp,
      to: "/trading",
    },
    {
      title: "أرباح الأيام",
      subtitle: "النتائج المالية حسب التاريخ",
      icon: Calendar,
      to: "/trading/daily",
    },
    {
      title: "أرباح الأصناف",
      subtitle: "تحليل ربحية كل صنف على حدة",
      icon: Package,
      to: "/trading/items",
    },
    {
      title: "ملخص الأرباح",
      subtitle: "تحليل هوامش الربح والتكاليف",
      icon: BarChart3,
      to: "/trading/profit",
    },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="المتاجرة والتحليل المالي" />
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <CompactListCard
            key={item.to}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            to={item.to}
          />
        ))}
      </div>
    </div>
  );
}
