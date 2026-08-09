import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "./BottomNavigation";
import { DEMO_CONNECTION } from "@/lib/demo/dashboard";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader connectionName={DEMO_CONNECTION.name} connected={DEMO_CONNECTION.connected} />
      <main className="mx-auto w-full max-w-5xl px-3 pb-24 pt-3 sm:px-4">{children}</main>
      <BottomNavigation />
    </div>
  );
}