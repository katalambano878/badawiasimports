/**
 * Append width/quality params for the local storage image optimizer.
 * Same-origin `/storage/v1/object/public/...` URLs are rewritten; external URLs pass through.
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  width = 600,
  quality = 75
): string {
  if (!url) return '';
  if (
    url.startsWith('/storage/') ||
    url.includes('/storage/v1/object/public/')
  ) {
    try {
      const u = new URL(url, 'https://local.invalid');
      // Don't shrink an already-requested larger thumbnail; still fill missing params.
      const existingW = Number(u.searchParams.get('w') || 0);
      const targetW = Math.min(Math.max(width, 40), 2000);
      if (!existingW || existingW > targetW) {
        u.searchParams.set('w', String(targetW));
      }
      if (!u.searchParams.has('q')) {
        u.searchParams.set('q', String(Math.min(Math.max(quality, 40), 90)));
      }
      if (!u.searchParams.has('f')) {
        u.searchParams.set('f', 'webp');
      }
      return `${u.pathname}?${u.searchParams.toString()}`;
    } catch {
      return url;
    }
  }
  return url;
}
