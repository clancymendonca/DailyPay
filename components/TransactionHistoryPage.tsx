"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import TransactionHistoryClient from "@/components/TransactionHistoryClient";

const TransactionHistoryPage = ({
  accounts,
  appwriteItemId,
  transactions,
  loggedInId,
  loggedInUser,
  searchParams,
}: {
  accounts: Account[];
  appwriteItemId: string;
  transactions: Transaction[];
  loggedInId: string;
  loggedInUser: User;
  searchParams: { q?: string; category?: string; from?: string; to?: string; page?: string };
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentParams = useSearchParams();

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(currentParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [currentParams, pathname, router]);

  const setAccount = useCallback((id: string) => {
    const params = new URLSearchParams(currentParams.toString());
    params.set("id", id);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [currentParams, pathname, router]);

  return (
    <TransactionHistoryClient
      accounts={accounts}
      appwriteItemId={appwriteItemId}
      transactions={transactions}
      loggedInId={loggedInId}
      loggedInUser={loggedInUser}
      searchParams={searchParams}
      onFilterChange={setFilter}
      onAccountChange={setAccount}
    />
  );
};

export default TransactionHistoryPage;
