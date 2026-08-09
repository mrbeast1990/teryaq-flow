import type { ReactNode } from "react";

export function KPIGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">{children}</div>;
}