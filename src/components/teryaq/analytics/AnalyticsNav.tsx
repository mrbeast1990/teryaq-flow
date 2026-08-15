import { BarChart3, Search, CalendarDays, AlertCircle, TrendingUp, Wallet, LayoutDashboard, History, PackageSearch, Package2, ShieldAlert } from "lucide-react";
import { CompactListCard } from "../CompactListCard";
import { SectionHeader } from "../SectionHeader";

export function AnalyticsNav() {
  const analyticsLinks = [
    {
      title: "البحث الشامل",
      subtitle: "بحث متقدم في الأصناف والزبائن والفواتير",
      icon: Search,
      to: "/analytics/search",
    },
    {
      title: "مقارنة الفترات",
      subtitle: "تحليل الفروقات بين فترتين زمنيتين",
      icon: CalendarDays,
      to: "/analytics/compare",
    },
    {
      title: "تحليل ربحية الأصناف",
      subtitle: "أداء الأصناف المالي وتقدير الأرباح",
      icon: TrendingUp,
      to: "/analytics/item-profit",
    },
    {
      title: "مراقبة أسعار الشراء",
      subtitle: "تتبع تغيرات أسعار التكلفة من الموردين",
      icon: History,
      to: "/analytics/prices",
    },
    {
      title: "مركز التنبيهات",
      subtitle: "إشعارات هامة حول المخزون والأسعار",
      icon: AlertCircle,
      to: "/analytics/alerts",
    },
  ];

  const operationalLinks = [
    {
      title: "تتبع الصنف",
      subtitle: "حركة وتاريخ الصنف التفصيلي",
      icon: PackageSearch,
      to: "/items/track",
    },
    {
      title: "الأصناف النافدة",
      subtitle: "متابعة النواقص والطلب",
      icon: Package2,
      to: "/items/out-of-stock",
    },
    {
      title: "متابعة الصلاحية",
      subtitle: "تنبيهات الأصناف القريبة من الانتهاء",
      icon: ShieldAlert,
      to: "/items/expiry",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4">
          <CompactListCard
            title={analyticsLinks[0].title}
            subtitle={analyticsLinks[0].subtitle}
            icon={analyticsLinks[0].icon}
            to={analyticsLinks[0].to}
            variant="primary"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {analyticsLinks.slice(1).map((item) => (
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

      <div>
        <SectionHeader title="أدوات مساعدة" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {operationalLinks.map((item) => (
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
    </div>
  );
}
