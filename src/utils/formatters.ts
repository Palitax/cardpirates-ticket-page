/**
 * Formats a price amount into German locale standard (e.g. 45.0 EUR -> 45,00 €)
 */
export function formatPrice(amount: string | number | undefined | null, currencyCode: string = 'EUR'): string {
  if (amount === undefined || amount === null) return '0,00 €';
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));
  if (isNaN(num)) return '0,00 €';

  const formattedNum = num.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currencyCode === 'EUR' ? '€' : currencyCode;
  return `${formattedNum} ${symbol}`;
}
