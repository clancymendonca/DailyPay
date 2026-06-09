import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "./redirect";
import { isAuthRoute, isProtectedRoute } from "./middleware-routes";

describe("getSafeRedirectPath", () => {
  it("returns / for invalid redirects", () => {
    expect(getSafeRedirectPath(undefined)).toBe("/");
    expect(getSafeRedirectPath("//evil.com")).toBe("/");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/");
  });

  it("allows internal paths", () => {
    expect(getSafeRedirectPath("/my-banks")).toBe("/my-banks");
  });
});

describe("middleware routes", () => {
  it("identifies auth routes", () => {
    expect(isAuthRoute("/sign-in")).toBe(true);
    expect(isAuthRoute("/forgot-password")).toBe(true);
    expect(isAuthRoute("/my-banks")).toBe(false);
  });

  it("identifies protected routes", () => {
    expect(isProtectedRoute("/")).toBe(true);
    expect(isProtectedRoute("/transfer-history")).toBe(true);
    expect(isProtectedRoute("/sign-in")).toBe(false);
  });
});
