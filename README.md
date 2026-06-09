# Daily Pay

A modern banking dashboard built with Next.js 14. Connect bank accounts via Plaid, track transactions, and transfer funds with Dwolla — backed by Appwrite for auth and data storage.

## Architecture

```
Browser (Next.js App Router)
    ├── Appwrite — authentication, user/bank/transaction/audit documents
    ├── Plaid — bank linking, balances, transaction sync + webhooks
    └── Dwolla — ACH transfers between funding sources
```

## Prerequisites

- Node.js 20+
- Appwrite project with Auth (email/password + optional Google OAuth)
- Plaid sandbox credentials
- Dwolla sandbox credentials

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Appwrite collections

Create indexes on:
- **Transactions**: `senderBankId`, `receiverBankId`, `senderId`, `receiverId`
- **Banks**: `shareableId`, `bankId` (Plaid item ID), `userId`

**Banks** — add fields: `transactionsCursor` (string), `needsRelink` (boolean)

**Transactions** — optional: `dwollaTransferUrl` (string)

**Audit** (optional) — `userId`, `action`, `metadata`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run format` | Prettier format |

## Plaid webhooks

Register `https://your-domain.com/api/plaid/webhook` in the Plaid Dashboard for:
- `TRANSACTIONS` / `SYNC_UPDATES_AVAILABLE`
- `ITEM` / `ERROR`, `PENDING_EXPIRATION`

## Deployment (Vercel)

Set all variables from `.env.example`. Required for build:
- All `APPWRITE_*`, `PLAID_*`, `DWOLLA_*` variables
- Optional: `ENCRYPTION_KEY` (32+ chars) to encrypt bank tokens at rest
- Optional: `APPWRITE_AUDIT_COLLECTION_ID` for audit logging

Use separate Appwrite/Plaid/Dwolla projects for staging vs production.

## Security

- Route protection via `middleware.ts`
- Server actions verify bank ownership before reads/writes
- Transfers go through `initiateTransfer` server action only
- API routes rate-limited (in-memory; use Redis in production)
- Sandbox SSN defaults gated behind `DWOLLA_ENV=sandbox`

## Health check

`GET /api/health` returns `{ status: "ok" }`
