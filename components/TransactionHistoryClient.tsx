"use client";

import HeaderBox from '@/components/HeaderBox';
import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import RelinkBankButton from '@/components/RelinkBankButton';
import TransactionFilters, { filterTransactions, exportTransactionsCsv } from '@/components/TransactionFilters';
import { BankTabItem } from '@/components/BankTabItem';
import { formatAmount } from '@/lib/utils';
import { Button } from './ui/button';

const TransactionHistoryClient = ({
  accounts,
  appwriteItemId,
  transactions,
  loggedInId,
  loggedInUser,
  searchParams,
  onFilterChange,
  onAccountChange,
}: {
  accounts: Account[];
  appwriteItemId: string;
  transactions: Transaction[];
  loggedInId: string;
  loggedInUser: User;
  searchParams: { q?: string; category?: string; from?: string; to?: string; page?: string };
  onFilterChange: (key: string, value: string) => void;
  onAccountChange: (id: string) => void;
}) => {
  const currentPage = Number(searchParams.page) || 1;
  const filtered = filterTransactions(transactions, searchParams);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const currentTransactions = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const selectedAccount = accounts.find((a) => a.appwriteItemId === appwriteItemId) ?? accounts[0];

  return (
    <div className="transactions">
      <div className="transactions-header">
        <HeaderBox title="Transaction History" subtext="See your bank details and transactions." />
      </div>

      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {accounts.map((account) => (
            <button
              key={account.appwriteItemId}
              type="button"
              onClick={() => onAccountChange(account.appwriteItemId)}
              className={`rounded-lg border px-3 py-2 ${account.appwriteItemId === appwriteItemId ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
            >
              <BankTabItem account={account} appwriteItemId={appwriteItemId} />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white">{selectedAccount?.name}</h2>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●● {selectedAccount?.mask}
            </p>
          </div>
          <div className='transactions-account-balance'>
            <p className="text-14">Current balance</p>
            <p className="text-24 text-center font-bold">{formatAmount(selectedAccount?.currentBalance ?? 0)}</p>
          </div>
        </div>

        <TransactionFilters
          transactions={transactions}
          searchParams={searchParams}
          onFilterChange={onFilterChange}
        />

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => exportTransactionsCsv(filtered)}>
            Export CSV
          </Button>
        </div>

        <section className="flex w-full flex-col gap-6">
          {currentTransactions.length > 0 ? (
            <>
              <TransactionsTable transactions={currentTransactions} />
              {totalPages > 1 && (
                <Pagination totalPages={totalPages} page={currentPage} />
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found for this account.</p>
              <RelinkBankButton user={loggedInUser} bankId={appwriteItemId} variant="primary" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TransactionHistoryClient;
