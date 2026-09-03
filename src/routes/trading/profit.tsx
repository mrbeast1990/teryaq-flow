import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/trading/profit")({
  beforeLoad: () => {
    throw redirect({ to: "/trading" });
  },
});
