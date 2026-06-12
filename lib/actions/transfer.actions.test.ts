import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth", () => ({
  requireLoggedInUser: vi.fn(),
  requireBankOwnership: vi.fn(),
}));

vi.mock("./dwolla.actions", () => ({
  createTransfer: vi.fn(),
}));

vi.mock("./transaction.actions", () => ({
  createTransaction: vi.fn(),
}));

vi.mock("./user.actions", () => ({
  getBankByShareableId: vi.fn(),
}));

vi.mock("../audit", () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireLoggedInUser, requireBankOwnership } from "../auth";
import { createTransfer } from "./dwolla.actions";
import { createTransaction } from "./transaction.actions";
import { getBankByShareableId } from "./user.actions";
import { initiateTransfer, previewTransfer } from "./transfer.actions";

const senderBank = {
  $id: "bank-sender",
  userId: "user-1",
  fundingSourceUrl: "https://dwolla/sender",
  accountId: "acc-sender-1234",
} as Bank;

const receiverBank = {
  $id: "bank-receiver",
  userId: "user-2",
  fundingSourceUrl: "https://dwolla/receiver",
  accountId: "acc-receiver-5678",
} as Bank;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireLoggedInUser).mockResolvedValue({ $id: "user-1" } as User);
  vi.mocked(requireBankOwnership).mockResolvedValue(senderBank);
});

describe("previewTransfer", () => {
  it("returns masked account details", async () => {
    vi.mocked(getBankByShareableId).mockResolvedValue(receiverBank);

    const result = await previewTransfer({
      senderBankId: "bank-sender",
      receiverShareableId: "share-receiver",
      amount: 25.5,
    });

    expect(result).toEqual({
      amount: "25.50",
      senderMask: "1234",
      receiverMask: "5678",
    });
  });

  it("throws when receiver not found", async () => {
    vi.mocked(getBankByShareableId).mockResolvedValue(null);

    await expect(
      previewTransfer({
        senderBankId: "bank-sender",
        receiverShareableId: "missing",
        amount: 10,
      })
    ).rejects.toThrow("Receiver not found");
  });
});

describe("initiateTransfer", () => {
  it("creates transfer and transaction", async () => {
    vi.mocked(getBankByShareableId).mockResolvedValue(receiverBank);
    vi.mocked(createTransfer).mockResolvedValue("https://dwolla/transfer/1");
    vi.mocked(createTransaction).mockResolvedValue({ $id: "tx-1" } as Transaction);

    const result = await initiateTransfer({
      senderBankId: "bank-sender",
      receiverShareableId: "share-receiver",
      amount: 50,
      name: "Test User",
      email: "test@example.com",
    });

    expect(createTransfer).toHaveBeenCalledWith({
      sourceFundingSourceUrl: senderBank.fundingSourceUrl,
      destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
      amount: "50.00",
    });
    expect(result).toEqual({ $id: "tx-1" });
  });

  it("rejects transfer to same account", async () => {
    vi.mocked(getBankByShareableId).mockResolvedValue(senderBank);

    await expect(
      initiateTransfer({
        senderBankId: "bank-sender",
        receiverShareableId: "share-sender",
        amount: 10,
        name: "Test",
        email: "test@example.com",
      })
    ).rejects.toThrow("Cannot transfer to the same account");
  });
});
