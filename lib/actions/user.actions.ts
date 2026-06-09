'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { unstable_noStore as noStore } from 'next/cache';
import { plaidClient } from '@/lib/plaid';
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { env } from "@/lib/env";
import { decryptSecret, encryptSecret, generateShareableId } from "@/lib/encryption";
import { logAuditEvent } from "@/lib/audit";

const validateCustomerData = (customerData: NewDwollaCustomerParams) => {
  const errors: string[] = [];
  if (!customerData.firstName?.trim()) errors.push("firstName is required");
  if (!customerData.lastName?.trim()) errors.push("lastName is required");
  if (!customerData.email?.trim()) errors.push("email is required");
  if (!customerData.ssn?.match(/^\d{9}$/)) errors.push("ssn must be 9 digits");
  return { isValid: errors.length === 0, errors };
};

async function assertSessionUser(user: User) {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn || loggedIn.$id !== user.$id) {
    throw new Error("Unauthorized");
  }
}

function getAccessToken(bank: Bank): string {
  return decryptSecret(bank.accessToken);
}

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    if (!userId) return null;
    const { database } = await createAdminClient();
    const user = await database.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.equal('userId', [userId])]
    );
    return parseStringify(user.documents[0] || null);
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return null;
  }
};

export const createUserDocument = async (userData: { userId: string; email: string; name: string; }) => {
  try {
    const { database } = await createAdminClient();
    const [firstName, ...lastNameParts] = userData.name.split(' ');
    const lastName = lastNameParts.join(' ');
    const newUser = await database.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      ID.unique(),
      {
        userId: userData.userId,
        email: userData.email,
        firstName: firstName || 'User',
        lastName: lastName || '',
        address1: '', city: '', state: '', postalCode: '',
        dateOfBirth: '', ssn: '',
        dwollaCustomerId: '', dwollaCustomerUrl: ''
      }
    );
    return parseStringify(newUser);
  } catch (error) {
    console.error('Error creating user document:', error);
    return null;
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account, user: userAdmin } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    cookies().set("appwrite-session", session.secret, {
      path: "/", httpOnly: true, sameSite: "strict", secure: true,
    });
    let user = await getUserInfo({ userId: session.userId });
    if (!user) {
      const appwriteUser = await userAdmin.get(session.userId);
      user = await createUserDocument({
        userId: appwriteUser.$id,
        email: appwriteUser.email,
        name: appwriteUser.name,
      });
    }
    return parseStringify(user);
  } catch (error) {
    console.error('Error in signIn:', error);
    return null;
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;
  try {
    const { account, database } = await createAdminClient();
    const newUserAccount = await account.create(
      ID.unique(), email, password, `${firstName} ${lastName}`
    );
    if (!newUserAccount) throw new Error('Error creating user');

    const dwollaCustomerUrl = await createDwollaCustomer({ ...userData, type: 'personal' });
    if (!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer');

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
    const newUser = await database.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      ID.unique(),
      { ...userData, userId: newUserAccount.$id, dwollaCustomerId, dwollaCustomerUrl }
    );

    const session = await account.createEmailPasswordSession(email, password);
    cookies().set("appwrite-session", session.secret, {
      path: "/", httpOnly: true, sameSite: "strict", secure: true,
    });
    return parseStringify(newUser);
  } catch (error) {
    console.error('Error in signUp:', error);
    return null;
  }
};

export async function getLoggedInUser() {
  try {
    noStore();
    const sessionSecret = cookies().get("appwrite-session")?.value;
    if (!sessionSecret) return null;
    const { account } = await createSessionClient();
    const user = await account.get();
    return await getUserInfo({ userId: user.$id });
  } catch (error) {
    console.error('Error in getLoggedInUser:', error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    cookies().delete('appwrite-session');
    await account.deleteSession('current');
  } catch (error) {
    console.error('Error in logoutAccount:', error);
  }
};

export const requestPasswordRecovery = async (email: string) => {
  try {
    const { account } = await createAdminClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`;
    await account.createRecovery(email, redirectUrl);
    return { success: true };
  } catch (error) {
    console.error('Password recovery failed:', error);
    return { success: false };
  }
};

export const createLinkToken = async (user: User) => {
  try {
    await assertSessionUser(user);
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.$id },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth', 'transactions'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    });
    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    return null;
  }
};

export const createBankAccount = async (props: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    const bankAccount = await database.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      ID.unique(),
      {
        ...props,
        accessToken: encryptSecret(props.accessToken),
        transactionsCursor: '',
        needsRelink: false,
      }
    );
    return parseStringify(bankAccount);
  } catch (error) {
    console.error('Error creating bank account:', error);
    return null;
  }
};

export const updateBankAccount = async ({
  bankId, accessToken, requesterId,
}: { bankId: string; accessToken: string; requesterId?: string }) => {
  try {
    const bank = await getBank({ documentId: bankId, requesterId });
    if (!bank) return null;
    const { database } = await createAdminClient();
    const updated = await database.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      bankId,
      { accessToken: encryptSecret(accessToken), needsRelink: false }
    );
    return parseStringify(updated);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return null;
  }
};

export const updateBankCursor = async ({
  bankId, cursor,
}: { bankId: string; cursor: string }) => {
  try {
    const { database } = await createAdminClient();
    await database.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      bankId,
      { transactionsCursor: cursor }
    );
  } catch (error) {
    console.error('Error updating bank cursor:', error);
  }
};

export const updateBankRelinkFlag = async ({
  bankId, needsRelink,
}: { bankId: string; needsRelink: boolean }) => {
  try {
    const { database } = await createAdminClient();
    await database.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      bankId,
      { needsRelink }
    );
  } catch (error) {
    console.error('Error updating bank relink flag:', error);
  }
};

export const exchangePublicToken = async ({ publicToken, user }: exchangePublicTokenProps) => {
  try {
    await assertSessionUser(user);

    if (!user.dwollaCustomerId?.trim()) {
      const sandboxSsn = env.DWOLLA_ENV === 'sandbox' ? '123456789' : '';
      const customerData = {
        firstName: user.firstName || 'User',
        lastName: user.lastName || 'User',
        email: user.email,
        type: 'personal' as const,
        address1: user.address1 || '123 Main St',
        city: user.city || 'New York',
        state: user.state?.length === 2 ? user.state : 'NY',
        postalCode: user.postalCode || '10001',
        dateOfBirth: user.dateOfBirth?.match(/^\d{4}-\d{2}-\d{2}$/) ? user.dateOfBirth : '1990-01-01',
        ssn: user.ssn?.match(/^\d{9}$/) ? user.ssn : sandboxSsn,
      };
      const validation = validateCustomerData(customerData);
      if (!validation.isValid) throw new Error(`Invalid customer data: ${validation.errors.join(', ')}`);

      const dwollaCustomerUrl = await createDwollaCustomer(customerData);
      if (!dwollaCustomerUrl) throw new Error("Failed to create Dwolla customer");

      const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);
      const { database } = await createAdminClient();
      await database.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        user.$id,
        { dwollaCustomerId, dwollaCustomerUrl: dwollaCustomerUrl }
      );
      user.dwollaCustomerId = dwollaCustomerId;
    }

    const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    const accountData = accountsResponse.data.accounts[0];

    const processorTokenResponse = await plaidClient.processorTokenCreate({
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    });

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken: processorTokenResponse.data.processor_token,
      bankName: accountData.name,
    });
    if (!fundingSourceUrl) throw new Error("Failed to create funding source");

    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: generateShareableId(),
    });

    await logAuditEvent("bank.connected", { bankName: accountData.name });
    revalidatePath("/");
    return parseStringify({ publicTokenExchange: "complete" });
  } catch (error) {
    console.error("Error exchanging public token:", error);
    throw error;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    noStore();
    if (!userId) return [];
    const loggedIn = await getLoggedInUser();
    if (!loggedIn || loggedIn.$id !== userId) return [];

    const { database } = await createAdminClient();
    const banks = await database.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      [Query.equal('userId', [userId])]
    );
    return parseStringify(banks.documents.map((b) => ({
      ...b,
      accessToken: getAccessToken(b as unknown as Bank),
    })));
  } catch (error) {
    console.error('Error in getBanks:', error);
    return [];
  }
};

export const getBank = async ({ documentId, requesterId }: getBankProps) => {
  try {
    noStore();
    if (!documentId) return null;

    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      [Query.equal('$id', [documentId])]
    );
    const doc = bank.documents[0];
    if (!doc) return null;

    if (requesterId && (doc as unknown as Bank).userId !== requesterId) return null;

    return parseStringify({
      ...doc,
      accessToken: getAccessToken(doc as unknown as Bank),
    });
  } catch (error) {
    console.error('Error in getBank:', error);
    return null;
  }
};

export const getBankByShareableId = async ({ shareableId }: getBankByShareableIdProps) => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      [Query.equal('shareableId', [shareableId])]
    );
    if (bank.total !== 1) return null;
    const doc = bank.documents[0];
    return parseStringify({
      ...doc,
      accessToken: getAccessToken(doc as unknown as Bank),
    });
  } catch (error) {
    console.error('Error in getBankByShareableId:', error);
    return null;
  }
};

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      [Query.equal('accountId', [accountId])]
    );
    if (bank.total !== 1) return null;
    const doc = bank.documents[0];
    return parseStringify({
      ...doc,
      accessToken: getAccessToken(doc as unknown as Bank),
    });
  } catch (error) {
    console.error('Error in getBankByAccountId:', error);
    return null;
  }
};

export const deleteBankAccount = async ({ bankId }: { bankId: string }) => {
  try {
    const loggedIn = await getLoggedInUser();
    if (!loggedIn) throw new Error("Unauthorized");

    const bank = await getBank({ documentId: bankId, requesterId: loggedIn.$id });
    if (!bank) throw new Error("Forbidden");

    try {
      await plaidClient.itemRemove({ access_token: getAccessToken(bank) });
    } catch (error) {
      console.error("Plaid item remove failed:", error);
    }

    const { database } = await createAdminClient();
    await database.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_BANK_COLLECTION_ID,
      bankId
    );

    await logAuditEvent("bank.disconnected", { bankId });
    revalidatePath("/");
    revalidatePath("/my-banks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting bank account:", error);
    throw error;
  }
};

export { getAccessToken };
