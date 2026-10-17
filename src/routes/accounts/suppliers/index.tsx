import { createFileRoute } from "@tanstack/react-router";
import { AccountDirectoryPage } from "@/components/teryaq/accounts/AccountDirectoryPage";
export const Route = createFileRoute("/accounts/suppliers/")({
  head: () => ({ meta: [{ title: "الموردون — Teryaq" }] }),
  component: () => <AccountDirectoryPage kind="supplier" />,
});
