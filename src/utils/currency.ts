export type Currency = 'IQD' | 'USD';

export const DEFAULT_EXCHANGE_RATE = 1500; // 1 USD = 1500 IQD

/**
 * Formats a monetary amount (stored in base currency IQD) according to the active currency,
 * language, and exchange rate.
 */
export function formatCurrency(
  amountInIQD: number,
  currency: Currency | string = 'IQD',
  lang: 'en' | 'ku' | string = 'ku',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): string {
  if (isNaN(amountInIQD)) return '0';

  if (currency === 'USD') {
    const usdAmount = exchangeRate > 0 ? amountInIQD / exchangeRate : 0;
    return `$${usdAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    // IQD (Iraqi Dinar)
    const formattedNumber = Math.round(amountInIQD).toLocaleString('en-US');
    if (lang === 'ku') {
      return formattedNumber;
    }
    return `${formattedNumber} IQD`;
  }
}

/**
 * Converts an input value to IQD base amount depending on the current active currency.
 * If active currency is USD, multiplies input by exchangeRate to get base IQD amount.
 */
export function toBaseIQD(
  inputAmount: number,
  currency: Currency | string = 'IQD',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (currency === 'USD') {
    return inputAmount * exchangeRate;
  }
  return inputAmount;
}

/**
 * Converts a base IQD amount to the active currency value (numeric).
 */
export function fromBaseIQD(
  baseAmountIQD: number,
  currency: Currency | string = 'IQD',
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  if (currency === 'USD') {
    return exchangeRate > 0 ? baseAmountIQD / exchangeRate : 0;
  }
  return baseAmountIQD;
}
