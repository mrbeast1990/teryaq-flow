import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profit-reports/items")({
  beforeLoad: () => {
    throw redirect({ to: "/analytics/item-profit" });
  },
});
