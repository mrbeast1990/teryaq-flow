import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/trading")({
  component: TradingLayout,
});

function TradingLayout() {
  return <Outlet />;
}
