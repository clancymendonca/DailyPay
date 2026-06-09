import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions/user.actions", () => ({
  getLoggedInUser: vi.fn(),
  getBank: vi.fn(),
  getBankByShareableId: vi.fn(),
}));

import { getLoggedInUser, getBank, getBankByShareableId } from "./actions/user.actions";
import {
  requireLoggedInUser,
  requireBankOwnership,
  resolveReceiverBank,
} from "./auth";

const mockUser = { $id: "user-1" } as User;
const mockBank = { $id: "bank-1", userId: "user-1" } as Bank;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireLoggedInUser", () => {
  it("returns user when logged in", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
    await expect(requireLoggedInUser()).resolves.toEqual(mockUser);
  });

  it("throws when not logged in", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(null);
    await expect(requireLoggedInUser()).rejects.toThrow("Unauthorized");
  });
});

describe("requireBankOwnership", () => {
  it("returns bank when owned", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
    vi.mocked(getBank).mockResolvedValue(mockBank);
    await expect(requireBankOwnership("bank-1")).resolves.toEqual(mockBank);
  });

  it("throws when bank not found", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
    vi.mocked(getBank).mockResolvedValue(null);
    await expect(requireBankOwnership("bank-1")).rejects.toThrow("Forbidden");
  });
});

describe("resolveReceiverBank", () => {
  it("returns receiver bank", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
    vi.mocked(getBankByShareableId).mockResolvedValue(mockBank);
    await expect(resolveReceiverBank("share-1")).resolves.toEqual(mockBank);
  });

  it("throws when receiver not found", async () => {
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);
    vi.mocked(getBankByShareableId).mockResolvedValue(null);
    await expect(resolveReceiverBank("share-1")).rejects.toThrow("Receiver not found");
  });
});
