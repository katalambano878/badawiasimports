/**
 * Format price with currency symbol.
 * Use getSetting('currency_symbol') from useCMS for store-specific currency.
 */
export function formatPrice(amount: number, symbol = '$'): string {
  return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
