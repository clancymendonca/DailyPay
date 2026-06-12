"use server";

import { CountryCode, AccountBase, Transaction as PlaidTransaction } from "plaid";
import { unstable_noStore as noStore } from 'next/cache';

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";
import { requireOwnUserId } from "../auth";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank, updateBankCursor, getAccessToken, getLoggedInUser } from "./user.actions";

function resolvePlaidAccount(accounts: AccountBase[], accountId: string): AccountBase {
  return accounts.find((a) => a.account_id === accountId) ?? accounts[0];
}

export const getAccounts = async ({ userId }: getAccountsProps) => {
  try {
    noStore();
    await requireOwnUserId(userId);

    const banks = await getBanks({ userId });
    if (!banks?.length) {
      return parseStringify({ data: [], totalBanks: 0, totalCurrentBalance: 0 });
    }

    const accounts = await Promise.all(
      banks.map(async (bank: Bank) => {
        const accountsResponse = await plaidClient.accountsGet({
          access_token: getAccessToken(bank),
        });
        const accountData = resolvePlaidAccount(accountsResponse.data.accounts, bank.accountId);

        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });

        return {
          id: accountData.account_id,
          availableBalance: accountData.balances.available ?? 0,
          currentBalance: accountData.balances.current ?? 0,
          institutionId: institution?.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask ?? '',
          type: accountData.type as string,
          subtype: accountData.subtype as string,
          appwriteItemId: bank.$id,
          shareableId: bank.shareableId,
        };
      })
    );

    const totalCurrentBalance = accounts.reduce((t, a) => t + a.currentBalance, 0);
    return parseStringify({ data: accounts, totalBanks: accounts.length, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return parseStringify({ data: [], totalBanks: 0, totalCurrentBalance: 0 });
  }
};

export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    noStore();
    if (!appwriteItemId) return null;

    const loggedIn = await getLoggedInUser();
    if (!loggedIn) return null;

    const bank = await getBank({ documentId: appwriteItemId, requesterId: loggedIn.$id });
    if (!bank) return null;

    const accessToken = getAccessToken(bank);
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accountData = resolvePlaidAccount(accountsResponse.data.accounts, bank.accountId);

    const transferTransactionsData = await getTransactionsByBankId({ bankId: bank.$id });
    const transferTransactions = transferTransactionsData?.documents?.map(
      (transferData: Transaction) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
      })
    ) || [];

    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    const transactions = await syncAndGetTransactions({
      accessToken,
      bankId: bank.$id,
      cursor: bank.transactionsCursor || undefined,
    });

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available ?? 0,
      currentBalance: accountData.balances.current ?? 0,
      institutionId: institution?.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask ?? '',
      type: accountData.type as string,
      subtype: accountData.subtype as string,
      appwriteItemId: bank.$id,
    };

    const allTransactions = [...(transactions || []), ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({ data: account, transactions: allTransactions });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
    return null;
  }
};

export const syncAndGetTransactions = async ({
  accessToken,
  bankId,
  cursor,
}: {
  accessToken: string;
  bankId: string;
  cursor?: string;
}) => {
  try {
    if (!accessToken) return [];

    let nextCursor = cursor ?? undefined;
    let hasMore = true;
    const allAdded: PlaidTransaction[] = [];

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: nextCursor,
      });

      allAdded.push(...response.data.added);
      nextCursor = response.data.next_cursor;
      hasMore = response.data.has_more;
    }

    if (nextCursor) {
      await updateBankCursor({ bankId, cursor: nextCursor });
    }

    const transactions = allAdded.map((transaction) => ({
      id: transaction.transaction_id,
      name: transaction.name,
      paymentChannel: transaction.payment_channel,
      type: transaction.payment_channel,
      accountId: transaction.account_id,
      amount: transaction.amount,
      pending: transaction.pending,
      category: transaction.personal_finance_category?.primary || transaction.category?.[0] || "",
      date: transaction.date,
      image: transaction.logo_url,
    }));

    return parseStringify(transactions);
  } catch (error: unknown) {
    console.error("An error occurred while syncing transactions:", error);
    const plaidError = error as { response?: { data?: { error_code?: string } } };
    if (plaidError.response?.data?.error_code === 'ADDITIONAL_CONSENT_REQUIRED') {
      return [];
    }
    return [];
  }
};

export const getInstitution = async ({ institutionId }: getInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });
    return parseStringify(institutionResponse.data.institution);
  } catch (error) {
    console.error("An error occurred while getting the institution:", error);
    return null;
  }
};

export const syncBankTransactions = async ({ bankId }: { bankId: string }) => {
  const bank = await getBank({ documentId: bankId });
  if (!bank) return null;
  return syncAndGetTransactions({
    accessToken: getAccessToken(bank),
    bankId: bank.$id,
    cursor: bank.transactionsCursor || undefined,
  });
};
