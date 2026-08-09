import { Link } from "@tanstack/react-router";
import { Home, Wallet, Users, Package, LayoutGrid } from "lucide-react";

const ITEMS = [
  { to: "/", label: "الرئيسية", icon: Home, exact: true },
  { to: "/revenue", label: "الإيرادات", icon: Wallet, exact: false },
  { to: "/accounts", label: "الحسابات", icon: Users, exact: false },
  { to: "/items", label: "الأصناف", icon: Package, exact: false },
  { to: "/more", label: "المزيد", icon: LayoutGrid, exact: false },
] as const;

export function BottomNavigation() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur"
      style={{ boxShadow: "var(--shadow-nav)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              className="group flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}