import { TrendingUp, Package } from "lucide-react";
import { CompactListCard } from "../CompactListCard";
import { SectionHeader } from "../SectionHeader";

export function TradingNav() {
  const items = [
    {
      title: "المتاجرة والأرباح",
      subtitle: "المبيعات والتكلفة ومجمل الربح الرسمي",
      icon: TrendingUp,
      to: "/trading",
    },
    {
      title: "تحليل ربحية الأصناف",
      subtitle: "تحليل تقديري منفصل عن الربح الرسمي",
      icon: Package,
      to: "/trading/items",
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
