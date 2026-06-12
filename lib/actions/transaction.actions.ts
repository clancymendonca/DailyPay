"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
} = process.env;

export const createTransaction = async (transaction: CreateTransactionProps) => {
  try {
    const { database } = await createAdminClient();

    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      ID.unique(),
      {
        channel: 'online',
        category: 'Transfer',
        ...transaction,
        dwollaTransferUrl: transaction.dwollaTransferUrl ?? '',
      }
    )

    return parseStringify(newTransaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return null;
  }
}

export const getTransactionsByBankId = async ({bankId}: getTransactionsByBankIdProps) => {
  try {
    if (!bankId) {
      return { total: 0, documents: [] };
    }

    const { database } = await createAdminClient();

    const [senderResult, receiverResult] = await Promise.all([
      database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('senderBankId', bankId), Query.limit(100)]
      ),
      database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('receiverBankId', bankId), Query.limit(100)]
      ),
    ]);

    const merged = new Map<string, Transaction>();
    for (const doc of [...senderResult.documents, ...receiverResult.documents]) {
      merged.set(doc.$id, doc as unknown as Transaction);
    }

    const documents = Array.from(merged.values());

    return parseStringify({
      total: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Error getting transactions by bank ID:", error);
    return { total: 0, documents: [] };
  }
}

export const getUserTransfers = async ({ userId }: { userId: string }) => {
  try {
    if (!userId) return [];

    const { database } = await createAdminClient();

    const [sent, received] = await Promise.all([
      database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('senderId', userId), Query.orderDesc('$createdAt'), Query.limit(100)]
      ),
      database.listDocuments(
        DATABASE_ID!,
        TRANSACTION_COLLECTION_ID!,
        [Query.equal('receiverId', userId), Query.orderDesc('$createdAt'), Query.limit(100)]
      ),
    ]);

    const merged = new Map<string, Transaction>();
    for (const doc of [...sent.documents, ...received.documents]) {
      merged.set(doc.$id, doc as unknown as Transaction);
    }

    return parseStringify(
      Array.from(merged.values()).sort(
        (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )
    );
  } catch (error) {
    console.error("Error getting user transfers:", error);
    return [];
  }
}
