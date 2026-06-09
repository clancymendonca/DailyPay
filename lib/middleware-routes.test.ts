import { describe, expect, it } from "vitest";
import { isAuthRoute, isProtectedRoute } from "./middleware-routes";

describe("isAuthRoute", () => {
  it("matches auth pages", () => {
    expect(isAuthRoute("/sign-in")).toBe(true);
    expect(isAuthRoute("/sign-up")).toBe(true);
    expect(isAuthRoute("/forgot-password")).toBe(true);
  });

  it("does not match app routes", () => {
    expect(isAuthRoute("/my-banks")).toBe(false);
    expect(isAuthRoute("/")).toBe(false);
  });
});

describe("isProtectedRoute", () => {
  it("protects home and banking routes", () => {
    expect(isProtectedRoute("/")).toBe(true);
    expect(isProtectedRoute("/my-banks")).toBe(true);
    expect(isProtectedRoute("/transfer-history")).toBe(true);
    expect(isProtectedRoute("/api/plaid/exchange-token")).toBe(true);
  });

  it("does not protect auth routes", () => {
    expect(isProtectedRoute("/sign-in")).toBe(false);
  });
});
