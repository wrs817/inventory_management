/**
 * Returns a URL with the Vite base path prepended.
 * Works correctly both in local dev (base = '/') and on
 * GitHub Pages (base = '/inventory_management/').
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}

export function navigate(path: string): void {
  window.location.href = url(path);
}
