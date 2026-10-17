import { createFileRoute } from "@tanstack/react-router";
import { AccountDirectoryPage } from "@/components/teryaq/accounts/AccountDirectoryPage";
export const Route = createFileRoute("/accounts/customers/")({
  head: () => ({ meta: [{ title: "الزبائن — Teryaq" }] }),
  component: () => <AccountDirectoryPage kind="customer" />,
});
