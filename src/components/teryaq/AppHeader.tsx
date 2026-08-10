import { Settings, LogIn, WifiOff, Database } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSystemStatus, ApiError, API_BASE_URL } from "@/lib/api";

export function AppHeader() {
  const { data: status, error, isLoading, refetch } = useQuery({
    queryKey: ["systemStatus"],
    queryFn: () => getSystemStatus(),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error, just show the login button
      if (error?.type === 'AUTH_REQUIRED') return false;
      return failureCount < 2;
    }
  });

  const apiError = error as ApiError | null;
  const isAuthRequired = apiError?.type === 'AUTH_REQUIRED';
  const isNetworkError = apiError?.type === 'NETWORK_ERROR';
  
  const connected = status?.connected ?? false;
  const connectionName = status?.databaseName || "AlmohasebSQL";

  const handleLogin = () => {
    // Navigate normally to the API base URL to trigger Cloudflare interactive login
    window.location.href = API_BASE_URL;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[13px] font-extrabold text-primary-foreground">
            T
          </span>
          <span className="truncate text-lg font-extrabold tracking-tight">Teryaq</span>
          
          <div className="flex items-center gap-1.5 min-w-0">
            {isLoading ? (
              <div className="flex h-6 items-center gap-1.5 rounded-full border border-border bg-secondary px-2 text-[11px] font-semibold text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted animate-pulse" />
                جاري التحميل...
              </div>
            ) : isAuthRequired ? (
              <button
                onClick={handleLogin}
                className="flex h-6 items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 text-[11px] font-bold text-warning hover:bg-warning/20 transition-colors"
              >
                <LogIn className="size-3" />
                يتطلب تسجيل الدخول
              </button>
            ) : isNetworkError ? (
              <div className="flex h-6 items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2 text-[11px] font-bold text-destructive">
                <WifiOff className="size-3" />
                تعذر الوصول إلى الخادم
              </div>
            ) : (
              <div
                className={`flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-bold transition-colors ${
                  connected
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {connected ? (
                  <span className="size-1.5 rounded-full bg-success" />
                ) : (
                  <Database className="size-3" />
                )}
                <span className="truncate max-w-[100px]">
                  {connected ? connectionName : "AlmohasebSQL غير متصل"}
                </span>
                {connected ? "✓" : "✕"}
              </div>
            )}
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
