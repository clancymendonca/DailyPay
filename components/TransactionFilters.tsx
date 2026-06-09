"use client";

import { useMemo } from "react";
import { Input } from "./ui/input";

type FilterProps = {
  transactions: Transaction[];
  searchParams: {
    q?: string;
    category?: string;
    from?: string;
    to?: string;
  };
  onFilterChange: (key: string, value: string) => void;
};

const TransactionFilters = ({ transactions, searchParams, onFilterChange }: FilterProps) => {
  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [transactions]);

  return (
    <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 border border-gray-100">
      <Input
        placeholder="Search by name..."
        className="max-w-xs"
        defaultValue={searchParams.q ?? ""}
        onChange={(e) => onFilterChange("q", e.target.value)}
      />
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        defaultValue={searchParams.category ?? ""}
        onChange={(e) => onFilterChange("category", e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <Input
        type="date"
        className="max-w-[160px]"
        defaultValue={searchParams.from ?? ""}
        onChange={(e) => onFilterChange("from", e.target.value)}
      />
      <Input
        type="date"
        className="max-w-[160px]"
        defaultValue={searchParams.to ?? ""}
        onChange={(e) => onFilterChange("to", e.target.value)}
      />
    </div>
  );
};

export default TransactionFilters;

export function filterTransactions(
  transactions: Transaction[],
  params: { q?: string; category?: string; from?: string; to?: string }
) {
  return transactions.filter((tx) => {
    if (params.q && !tx.name?.toLowerCase().includes(params.q.toLowerCase())) return false;
    if (params.category && tx.category !== params.category) return false;
    if (params.from && new Date(tx.date) < new Date(params.from)) return false;
    if (params.to && new Date(tx.date) > new Date(params.to)) return false;
    return true;
  });
}

export function exportTransactionsCsv(transactions: Transaction[]) {
  const header = "Date,Name,Category,Amount\n";
  const rows = transactions.map((tx) =>
    `${tx.date},"${tx.name?.replace(/"/g, '""')}",${tx.category},${tx.amount}`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}
