import HeaderBox from '@/components/HeaderBox'
import PlaidLink from '@/components/PlaidLink';
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import React from 'react'

export const dynamic = 'force-dynamic';

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({ userId: loggedIn.$id });
  const accountsData = accounts?.data ?? [];

  if (accountsData.length === 0) {
    return (
      <section className="payment-transfer">
        <HeaderBox
          title="Payment Transfer"
          subtext="Connect a bank account before transferring funds."
        />
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center mt-8">
          <h2 className="text-18 font-semibold text-gray-900">No bank accounts connected</h2>
          <p className="text-14 text-gray-500 max-w-md">
            Link a bank account to send and receive transfers.
          </p>
          <PlaidLink user={loggedIn} variant="primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="payment-transfer">
      <HeaderBox
        title="Payment Transfer"
        subtext="Please provide any specific details or notes related to the payment transfer"
      />
      <section className="size-full pt-5">
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  )
}

export default Transfer
