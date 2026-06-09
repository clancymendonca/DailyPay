import { NextRequest, NextResponse } from "next/server";
import { syncBankTransactions } from "@/lib/actions/bank.actions";
import { updateBankRelinkFlag } from "@/lib/actions/user.actions";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyPlaidWebhook } from "@/lib/plaid-webhook-verify";
import { env } from "@/lib/env";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";

async function findBankByItemId(itemId: string) {
  const { database } = await createAdminClient();
  const result = await database.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_BANK_COLLECTION_ID,
    [Query.equal("bankId", itemId)]
  );
  return result.documents[0] ?? null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(`plaid-webhook:${ip}`, 30, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const rawBody = await request.text();
    const verified = await verifyPlaidWebhook(
      rawBody,
      request.headers.get("plaid-verification")
    );

    if (!verified) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { webhook_type, webhook_code, item_id } = body;

    if (webhook_type === "TRANSACTIONS" && webhook_code === "SYNC_UPDATES_AVAILABLE") {
      const bankDoc = await findBankByItemId(item_id);
      if (bankDoc) {
        await syncBankTransactions({ bankId: bankDoc.$id });
      }
    }

    if (webhook_type === "ITEM" && (webhook_code === "ERROR" || webhook_code === "PENDING_EXPIRATION")) {
      const bankDoc = await findBankByItemId(item_id);
      if (bankDoc) {
        await updateBankRelinkFlag({ bankId: bankDoc.$id, needsRelink: true });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Plaid webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
