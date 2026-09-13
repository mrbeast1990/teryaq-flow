import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profit-reports/trading/accountant")({
  beforeLoad: () => {
    throw redirect({ to: "/trading" });
  },
});
