import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/trading/daily")({
  beforeLoad: () => {
    throw redirect({ to: "/trading" });
  },
});
