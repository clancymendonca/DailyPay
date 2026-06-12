"use server";

import { getLoggedInUser, getBank, getBankByShareableId } from "./actions/user.actions";

export async function requireLoggedInUser(): Promise<User> {
  const user = await getLoggedInUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireBankOwnership(bankId: string): Promise<Bank> {
  const user = await requireLoggedInUser();
  const bank = await getBank({ documentId: bankId, requesterId: user.$id });
  if (!bank) {
    throw new Error("Forbidden");
  }
  return bank;
}

export async function requireOwnUserId(userId: string): Promise<User> {
  const user = await requireLoggedInUser();
  if (user.$id !== userId) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function resolveReceiverBank(shareableId: string): Promise<Bank> {
  await requireLoggedInUser();
  const bank = await getBankByShareableId({ shareableId });
  if (!bank) {
    throw new Error("Receiver not found");
  }
  return bank;
}
