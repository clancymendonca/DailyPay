"use client"

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankTabItem } from './BankTabItem'
import BankInfo from './BankInfo'
import TransactionsTable from './TransactionsTable'
import { Pagination } from './Pagination'
import RelinkBankButton from './RelinkBankButton'

const RecentTransactions = ({
  accounts,
  appwriteItemId,
  page = 1,
  user,
  transactionsByAccountId,
}: RecentTransactionsProps) => {
  const getTransactionsForAccount = (accountId: string) => {
    return transactionsByAccountId[accountId] || [];
  };

  const getPaginatedTransactions = (accountId: string, currentPage: number) => {
    const transactions = getTransactionsForAccount(accountId);
    const rowsPerPage = 10;
    const indexOfLastTransaction = currentPage * rowsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
    
    return transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  };

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent transactions</h2>
        <Link
          href={`/transaction-history/?id=${appwriteItemId}`}
          className="view-all-btn"
        >
          View all
        </Link>
      </header>

      <Tabs defaultValue={appwriteItemId} className="w-full">
      <TabsList className="recent-transactions-tablist">
          {accounts.map((account: Account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId}>
              <BankTabItem
                key={account.id}
                account={account}
                appwriteItemId={appwriteItemId}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {accounts.map((account: Account) => {
          const transactions = getTransactionsForAccount(account.appwriteItemId);
          const currentTransactions = getPaginatedTransactions(account.appwriteItemId, page);
          const rowsPerPage = 10;
          const totalPages = Math.ceil(transactions.length / rowsPerPage);

          return (
            <TabsContent
              value={account.appwriteItemId}
              key={account.id}
              className="space-y-4"
            >
              <BankInfo 
                account={account}
                appwriteItemId={appwriteItemId}
                type="full"
              />

              {transactions.length > 0 ? (
                <TransactionsTable transactions={currentTransactions} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions found for this account.</p>
                  <p className="text-sm mt-2 mb-4">
                    If you recently added this bank account, you may need to re-link it to access transaction data.
                  </p>
                  <RelinkBankButton 
                    user={user} 
                    bankId={account.appwriteItemId} 
                    variant="primary" 
                  />
                </div>
              )}

              {totalPages > 1 && (
                <div className="my-4 w-full">
                  <Pagination totalPages={totalPages} page={page} />
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  )
}

export default RecentTransactions
