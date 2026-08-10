import { Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSystemStatus } from "@/lib/api";

export function AppHeader() {
  const { data: status, isLoading } = useQuery({
    queryKey: ["systemStatus"],
    queryFn: () => getSystemStatus(),
    refetchInterval: 30000,
  });

  const connected = status?.connected ?? false;
  const connectionName = status?.databaseName || "AlmohasebSQL";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-primary-foreground">
            T
          </span>
          <span className="truncate text-lg font-extrabold tracking-tight">Teryaq</span>
          
          <div
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              isLoading
                ? "border-border bg-secondary text-muted-foreground"
                : connected
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isLoading ? "bg-muted animate-pulse" : connected ? "bg-success" : "bg-destructive"
              }`}
              aria-hidden
            />
            <span className="truncate max-w-[80px] sm:max-w-none">
              {connectionName}
            </span>
            {!isLoading && (connected ? "✓" : "✕")}
          </div>
        </div>
        <Link
          to="/more"
          aria-label="الإعدادات"
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Settings className="size-4" />
        </Link>
      </div>
    </header>
  );
}
