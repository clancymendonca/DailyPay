export function getSafeRedirectPath(redirect: string | undefined | null): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return '/';
  }
  return redirect;
}
