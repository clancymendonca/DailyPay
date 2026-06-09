"use server";

import { ID } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { env } from "./env";
import { requireLoggedInUser } from "./auth";

export async function logAuditEvent(
  action: string,
  metadata: Record<string, string | number | boolean> = {}
) {
  if (!env.APPWRITE_AUDIT_COLLECTION_ID) return;

  try {
    const user = await requireLoggedInUser();
    const { database } = await createAdminClient();

    await database.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_AUDIT_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        action,
        metadata: JSON.stringify(metadata),
      }
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
