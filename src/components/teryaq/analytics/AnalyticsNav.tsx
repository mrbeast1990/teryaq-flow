import { BarChart3, Search, CalendarDays, AlertCircle, TrendingUp, Wallet, LayoutDashboard, History, PackageSearch, Package2, ShieldAlert } from "lucide-react";
import { CompactListCard } from "../CompactListCard";
import { SectionHeader } from "../SectionHeader";

export function AnalyticsNav() {
  const analyticsLinks = [
    {
      title: "مركز التحليلات",
      subtitle: "لوحة التحكم والتحليلات الرئيسية",
      icon: BarChart3,
      to: "/analytics",
    },
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
      title: "تنبيهات الإدارة",
      subtitle: "إشعارات هامة حول المخزون والأسعار",
      icon: AlertCircle,
      to: "/analytics/alerts",
    },
    {
      title: "تحليل ربحية الأصناف",
      subtitle: "أداء الأصناف المالي وتقدير الأرباح",
      icon: TrendingUp,
      to: "/analytics/item-profit",
    },
    {
      title: "رأس المال والبضاعة",
      subtitle: "تقدير قيمة المخزون ورأس المال",
      icon: Wallet,
      to: "/analytics/capital",
    },
    {
      title: "لوحة المدير",
      subtitle: "نظرة تنفيذية سريعة على الصيدلية",
      icon: LayoutDashboard,
      to: "/analytics/manager",
    },
    {
      title: "مراقبة أسعار الشراء",
      subtitle: "تتبع تغيرات أسعار التكلفة من الموردين",
      icon: History,
      to: "/analytics/prices",
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
    <div className="space-y-6">
      <div>
        <SectionHeader title="مركز التحليلات" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {analyticsLinks.map((item) => (
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
        <SectionHeader title="أدوات التشغيل المساعدة" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
