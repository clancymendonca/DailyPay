import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import PlaidLink from '@/components/PlaidLink';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

export const dynamic = 'force-dynamic';

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({ userId: loggedIn.$id });
  const accountsData = accounts?.data ?? [];

  return (
    <section className='flex'>
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activites."
        />

        <div className="space-y-4">
          <h2 className="header-2">Your cards</h2>
          {accountsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <h3 className="text-18 font-semibold text-gray-900">No bank accounts yet</h3>
              <p className="text-14 text-gray-500 max-w-md">
                Connect your first bank account to view balances and manage cards.
              </p>
              <PlaidLink user={loggedIn} variant="primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {accountsData.map((a: Account) => (
                <BankCard
                  key={a.appwriteItemId}
                  account={a}
                  userName={loggedIn?.firstName}
                  bankId={a.appwriteItemId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default MyBanks
