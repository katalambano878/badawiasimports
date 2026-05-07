/** Default store phone when CMS / env not set */
export const DEFAULT_CONTACT_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || '0539781532';

/** Default store location when CMS not set */
export const DEFAULT_CONTACT_ADDRESS = process.env.NEXT_PUBLIC_STORE_ADDRESS || 'Tamale & Accra, Ghana';

/** Google Maps search for the store */
export const DEFAULT_CONTACT_MAP_LINK =
  process.env.NEXT_PUBLIC_STORE_MAP_LINK || 'https://maps.google.com/?q=Tamale+Ghana';

/** Apply default contact values only when a field is missing. */
export function applyCanonicalContact(s: Record<string, string>): void {
  if (!s['contact_phone']?.trim()) s['contact_phone'] = DEFAULT_CONTACT_PHONE;
  if (!s['contact_address']?.trim()) s['contact_address'] = DEFAULT_CONTACT_ADDRESS;
  if (!s['contact_map_link']?.trim()) s['contact_map_link'] = DEFAULT_CONTACT_MAP_LINK;
}

/**
 * Format phone for WhatsApp wa.me link (digits only, with Ghana +233 country code).
 */
export function toWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return '233' + digits.slice(1);
  if (digits.length >= 9) return '233' + digits;
  return digits;
}
