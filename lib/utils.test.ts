import { describe, expect, it } from "vitest";

import {
  authFormSchema,
  countTransactionCategories,
  decryptId,
  encryptId,
  formatAmount,
  getTransactionStatus,
} from "./utils";

describe("formatAmount", () => {
  it("formats USD currency", () => {
    expect(formatAmount(1234.5)).toBe("$1,234.50");
  });
});

describe("encryptId / decryptId", () => {
  it("round-trips an id", () => {
    const id = "account-123";
    expect(decryptId(encryptId(id))).toBe(id);
  });
});

describe("countTransactionCategories", () => {
  it("aggregates and sorts categories by count", () => {
    const transactions = [
      { category: "Food" },
      { category: "Travel" },
      { category: "Food" },
    ] as Transaction[];

    const result = countTransactionCategories(transactions);

    expect(result[0].name).toBe("Food");
    expect(result[0].count).toBe(2);
    expect(result[0].totalCount).toBe(3);
    expect(result[1].name).toBe("Travel");
  });
});

describe("getTransactionStatus", () => {
  it("returns Processing for recent dates", () => {
    const today = new Date();
    expect(getTransactionStatus(today)).toBe("Processing");
  });

  it("returns Success for older dates", () => {
    const old = new Date();
    old.setDate(old.getDate() - 5);
    expect(getTransactionStatus(old)).toBe("Success");
  });
});

describe("authFormSchema", () => {
  it("requires sign-up fields", () => {
    const result = authFormSchema("sign-up").safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("allows minimal sign-in fields", () => {
    const result = authFormSchema("sign-in").safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("validates sign-up SSN and DOB", () => {
    const result = authFormSchema("sign-up").safeParse({
      firstName: "John",
      lastName: "Doe",
      address1: "123 Main",
      city: "NYC",
      state: "NY",
      postalCode: "10001",
      dateOfBirth: "1990-01-01",
      ssn: "123456789",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid SSN on sign-up", () => {
    const result = authFormSchema("sign-up").safeParse({
      firstName: "John",
      lastName: "Doe",
      address1: "123 Main",
      city: "NYC",
      state: "NY",
      postalCode: "10001",
      dateOfBirth: "1990-01-01",
      ssn: "123",
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});
