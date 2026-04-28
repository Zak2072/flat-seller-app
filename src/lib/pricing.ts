/**
 * Pricing Logic for Property Vaults
 * 
 * First property: £50 + VAT
 * Subsequent properties: £25 + VAT
 */

export const VAT_RATE = 0.20;

export interface PriceBreakdown {
  basePrice: number;
  vatAmount: number;
  totalPrice: number;
}

/**
 * Calculates the price for a property vault based on the number of previously paid properties.
 * 
 * @param paidPropertiesCount The number of properties the user has already paid for.
 * @returns A breakdown of the price including base, VAT and total.
 */
export function calculatePrice(paidPropertiesCount: number): PriceBreakdown {
  const basePrice = paidPropertiesCount === 0 ? 50 : 25;
  const vatAmount = basePrice * VAT_RATE;
  const totalPrice = basePrice + vatAmount;

  return {
    basePrice,
    vatAmount,
    totalPrice
  };
}
