export const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

export const PROTECTED_PREFIXES = [
  "/my-banks",
  "/transaction-history",
  "/transfer-history",
  "/payment-transfer",
  "/api/plaid",
];

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function isProtectedRoute(pathname: string) {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
