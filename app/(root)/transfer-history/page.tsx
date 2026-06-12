import HeaderBox from '@/components/HeaderBox';
import { getUserTransfers } from '@/lib/actions/transaction.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { formatAmount, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const TransferHistory = async () => {
  const loggedIn = await getLoggedInUser();
  const transfers = await getUserTransfers({ userId: loggedIn.$id });

  return (
    <section className="flex flex-col gap-6">
      <HeaderBox
        title="Transfer History"
        subtext="View funds you have sent and received."
      />

      {transfers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-14 text-gray-600">No transfers yet.</p>
          <Link href="/payment-transfer" className="form-link mt-4 inline-block">
            Make a transfer
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          <table className="w-full text-14">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Direction</th>
                <th className="p-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((tx: Transaction) => {
                const isSent = tx.senderId === loggedIn.$id;
                return (
                  <tr key={tx.$id} className="border-t border-gray-100">
                    <td className="p-4">{formatDateTime(new Date(tx.$createdAt)).dateOnly}</td>
                    <td className="p-4">{tx.name}</td>
                    <td className="p-4">{isSent ? 'Sent' : 'Received'}</td>
                    <td className={`p-4 text-right font-medium ${isSent ? 'text-red-600' : 'text-green-600'}`}>
                      {isSent ? '-' : '+'}{formatAmount(Number(tx.amount))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TransferHistory;
