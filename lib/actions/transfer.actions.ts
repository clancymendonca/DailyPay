"use server";

import { createTransfer } from "./dwolla.actions";
import { createTransaction } from "./transaction.actions";
import { getBankByShareableId } from "./user.actions";
import { requireBankOwnership, requireLoggedInUser } from "../auth";
import { logAuditEvent } from "../audit";
import { parseStringify } from "../utils";
import { revalidatePath } from "next/cache";

export async function initiateTransfer(params: {
  senderBankId: string;
  receiverShareableId: string;
  amount: number;
  name: string;
  email: string;
}) {
  const user = await requireLoggedInUser();
  const senderBank = await requireBankOwnership(params.senderBankId);
  const receiverBank = await getBankByShareableId({
    shareableId: params.receiverShareableId,
  });

  if (!receiverBank) {
    throw new Error("Receiver not found");
  }

  if (receiverBank.$id === senderBank.$id) {
    throw new Error("Cannot transfer to the same account");
  }

  const amountStr = params.amount.toFixed(2);

  const transfer = await createTransfer({
    sourceFundingSourceUrl: senderBank.fundingSourceUrl,
    destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
    amount: amountStr,
  });

  if (!transfer) {
    throw new Error("Transfer failed");
  }

  const newTransaction = await createTransaction({
    name: params.name,
    amount: amountStr,
    senderId: senderBank.userId,
    senderBankId: senderBank.$id,
    receiverId: receiverBank.userId,
    receiverBankId: receiverBank.$id,
    email: params.email,
    dwollaTransferUrl: transfer,
  });

  await logAuditEvent("transfer.initiated", {
    amount: amountStr,
    senderBankId: senderBank.$id,
    receiverBankId: receiverBank.$id,
  });

  revalidatePath("/");
  revalidatePath("/transfer-history");

  return parseStringify(newTransaction);
}

export async function previewTransfer(params: {
  senderBankId: string;
  receiverShareableId: string;
  amount: number;
}) {
  const senderBank = await requireBankOwnership(params.senderBankId);
  const receiverBank = await getBankByShareableId({
    shareableId: params.receiverShareableId,
  });

  if (!receiverBank) {
    throw new Error("Receiver not found");
  }

  return parseStringify({
    amount: params.amount.toFixed(2),
    senderMask: senderBank.accountId.slice(-4),
    receiverMask: receiverBank.accountId.slice(-4),
  });
}
