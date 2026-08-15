import { TrendingUp, BarChart3, Package, Calendar } from "lucide-react";
import { CompactListCard } from "../CompactListCard";
import { SectionHeader } from "../SectionHeader";

export function TradingNav() {
  const items = [
    {
      title: "المتاجرة والأرباح",
      subtitle: "نظرة عامة على الأداء المالي",
      icon: TrendingUp,
      path: "/trading",
      color: "text-info",
    },
    {
      title: "أرباح الأيام",
      subtitle: "النتائج المالية حسب التاريخ",
      icon: Calendar,
      path: "/trading/daily",
      color: "text-primary",
    },
    {
      title: "أرباح الأصناف",
      subtitle: "تحليل ربحية كل صنف على حدة",
      icon: Package,
      path: "/trading/items",
      color: "text-success",
    },
    {
      title: "ملخص الأرباح",
      subtitle: "تحليل هوامش الربح والتكاليف",
      icon: BarChart3,
      path: "/trading/profit",
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="المتاجرة والتحليل المالي" />
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <CompactListCard
            key={item.path}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            path={item.path}
            iconColor={item.color}
          />
        ))}
      </div>
    </div>
  );
}
