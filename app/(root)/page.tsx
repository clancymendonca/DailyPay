import HeaderBox from '@/components/HeaderBox'
import PlaidLink from '@/components/PlaidLink';
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

export const dynamic = 'force-dynamic';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = await getLoggedInUser();
  
  if (!loggedIn) {
    return (
      <section className="home">
        <div className="home-content">
          <header className="home-header">
            <HeaderBox 
              type="greeting"
              title="Welcome"
              user="Guest"
              subtext="Please sign in to access your account."
            />
          </header>
        </div>
      </section>
    );
  }

  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  });

  const accountsData = accounts?.data || [];
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  const accountResults = await Promise.all(
    accountsData.map(async (a: Account) => {
      const result = await getAccount({ appwriteItemId: a.appwriteItemId });
      return [a.appwriteItemId, result?.transactions ?? []] as const;
    })
  );

  const transactionsByAccountId = Object.fromEntries(accountResults) as Record<string, Transaction[]>;
  const sidebarTransactions = appwriteItemId
    ? transactionsByAccountId[appwriteItemId] ?? []
    : [];

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox 
            type="greeting"
            title="Welcome"
            user={loggedIn.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox 
            accounts={accountsData}
            totalBanks={accounts?.totalBanks || 0}
            totalCurrentBalance={accounts?.totalCurrentBalance || 0}
          />
        </header>

        {accountsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <h2 className="text-18 font-semibold text-gray-900">No bank accounts connected</h2>
            <p className="text-14 text-gray-500 max-w-md">
              Connect your first bank account to view balances, track transactions, and transfer funds.
            </p>
            <PlaidLink user={loggedIn} variant="primary" />
          </div>
        ) : (
          <RecentTransactions 
            accounts={accountsData}
            appwriteItemId={appwriteItemId || ''}
            page={currentPage}
            user={loggedIn}
            transactionsByAccountId={transactionsByAccountId}
          />
        )}
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={sidebarTransactions}
        banks={accountsData.slice(0, 2)}
      />
    </section>
  )
}

export default Home
