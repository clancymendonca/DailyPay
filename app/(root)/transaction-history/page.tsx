import PlaidLink from '@/components/PlaidLink';
import TransactionHistoryPage from '@/components/TransactionHistoryPage';
import HeaderBox from '@/components/HeaderBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function EmptyState({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="transactions">
      <div className="transactions-header">
        <HeaderBox title="Transaction History" subtext="See your bank details and transactions." />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-12 text-center">
        <h2 className="text-18 font-semibold text-gray-900">{title}</h2>
        <p className="text-14 max-w-md text-gray-600">{description}</p>
        {children}
      </div>
    </div>
  );
}

const TransactionHistory = async ({
  searchParams,
}: {
  searchParams: { id?: string; page?: string; q?: string; category?: string; from?: string; to?: string };
}) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return (
      <EmptyState title="Sign in required" description="Please sign in to view your transaction history.">
        <Link href="/sign-in" className="form-link">Go to sign in</Link>
      </EmptyState>
    );
  }

  const accounts = await getAccounts({ userId: loggedIn.$id });
  const accountsData = accounts?.data ?? [];

  if (accountsData.length === 0) {
    return (
      <EmptyState title="No bank accounts connected" description="Connect a bank account to view your transaction history.">
        <PlaidLink user={loggedIn} variant="primary" />
      </EmptyState>
    );
  }

  const appwriteItemId = searchParams.id || accountsData[0]?.appwriteItemId;
  const account = await getAccount({ appwriteItemId });

  if (!account) {
    return (
      <EmptyState title="Unable to load account" description="We couldn't load this bank account.">
        <Link href="/" className="form-link">Back to home</Link>
      </EmptyState>
    );
  }

  return (
    <TransactionHistoryPage
      accounts={accountsData}
      appwriteItemId={appwriteItemId}
      transactions={account.transactions ?? []}
      loggedInId={loggedIn.$id}
      loggedInUser={loggedIn}
      searchParams={searchParams}
    />
  );
};

export default TransactionHistory;
