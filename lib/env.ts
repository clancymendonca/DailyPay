import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_APPWRITE_PROJECT: z.string().min(1),
  NEXT_APPWRITE_KEY: z.string().min(1),
  APPWRITE_DATABASE_ID: z.string().min(1),
  APPWRITE_USER_COLLECTION_ID: z.string().min(1),
  APPWRITE_BANK_COLLECTION_ID: z.string().min(1),
  APPWRITE_TRANSACTION_COLLECTION_ID: z.string().min(1),
  APPWRITE_AUDIT_COLLECTION_ID: z.string().optional(),
  PLAID_CLIENT_ID: z.string().min(1),
  PLAID_SECRET: z.string().min(1),
  PLAID_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  PLAID_WEBHOOK_VERIFICATION_KEY: z.string().optional(),
  DWOLLA_ENV: z.enum(["sandbox", "production"]),
  DWOLLA_KEY: z.string().min(1),
  DWOLLA_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  return parsed.data;
}

export const env = validateEnv();
