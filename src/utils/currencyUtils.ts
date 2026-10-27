import { CurrencyCode } from '../types/subscription';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  JPY: '¥',
  AUD: 'A$',
};

// Standard approximate exchange conversion factors relative to USD (1 USD = ...)
export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  JPY: 154.5,
  AUD: 1.52,
};

/**
 * Converts an amount from source currency to target currency
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  // Convert from -> USD -> to
  const inUSD = amount / (EXCHANGE_RATES[from] || 1);
  return inUSD * (EXCHANGE_RATES[to] || 1);
}

/**
 * Formats a numeric amount nicely with currency symbol and tabular decimals
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  fractionDigits: number = 2
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$';
  const decimals = currency === 'JPY' ? 0 : fractionDigits;

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
