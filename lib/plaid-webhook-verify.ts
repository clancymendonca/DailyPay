import { createHash, timingSafeEqual } from "crypto";
import { importJWK, jwtVerify } from "jose";
import { plaidClient } from "./plaid";
import { env } from "./env";

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export async function verifyPlaidWebhook(
  rawBody: string,
  verificationHeader: string | null
): Promise<boolean> {
  if (!env.PLAID_WEBHOOK_VERIFICATION_KEY) {
    return true;
  }

  if (!verificationHeader) {
    return false;
  }

  try {
    const header = JSON.parse(
      Buffer.from(verificationHeader.split(".")[0], "base64url").toString("utf8")
    ) as { kid?: string; alg?: string };

    if (!header.kid) {
      return false;
    }

    const keyResponse = await plaidClient.webhookVerificationKeyGet({
      key_id: header.kid,
    });

    const key = await importJWK(keyResponse.data.key as JsonWebKey, header.alg ?? "ES256");
    const { payload } = await jwtVerify(verificationHeader, key, {
      maxTokenAge: "5 min",
    });

    const claimedHash = payload.request_body_sha256 as string | undefined;
    if (!claimedHash) {
      return false;
    }

    const bodyHash = sha256Hex(rawBody);
    if (claimedHash.length !== bodyHash.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(claimedHash, "utf8") as unknown as NodeJS.ArrayBufferView,
      Buffer.from(bodyHash, "utf8") as unknown as NodeJS.ArrayBufferView
    );
  } catch (error) {
    console.error("Plaid webhook verification failed:", error);
    return false;
  }
}
