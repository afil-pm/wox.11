export interface TaxInput {
  salePrice: number;
  quantity: number;
  gstRate: number;
  taxInclusive: boolean;
}

export interface ItemTaxResult {
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  unitPrice: number;
  finalAmount: number;
}

export interface OrderTaxResult {
  items: ItemTaxResult[];
  totalTaxableAmount: number;
  totalGstAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalAmount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundCurrency(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateItemTax(input: TaxInput, isInterState: boolean): ItemTaxResult {
  const { salePrice, quantity, gstRate, taxInclusive } = input;

  const rate = Math.max(0, Math.min(gstRate, 100)) / 100;

  let taxableAmount: number;
  let gstAmount: number;

  if (taxInclusive) {
    const inclusiveTotal = roundCurrency(salePrice * quantity);
    gstAmount = roundCurrency(inclusiveTotal * rate / (1 + rate));
    taxableAmount = roundCurrency(inclusiveTotal - gstAmount);
  } else {
    taxableAmount = roundCurrency(salePrice * quantity);
    gstAmount = roundCurrency(taxableAmount * rate);
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstAmount = gstAmount;
  } else {
    cgstAmount = roundCurrency(gstAmount / 2);
    sgstAmount = roundCurrency(gstAmount - cgstAmount);
  }

  const unitPrice = taxableAmount / quantity;
  const finalAmount = roundCurrency(taxableAmount + gstAmount);

  return {
    taxableAmount,
    gstRate: gstRate,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    unitPrice: roundCurrency(unitPrice),
    finalAmount,
  };
}

export function calculateOrderTax(
  items: TaxInput[],
  sellerState: string,
  customerState: string
): OrderTaxResult {
  const isInterState = sellerState.trim().toLowerCase() !== customerState.trim().toLowerCase();

  const results = items.map((item) => calculateItemTax(item, isInterState));

  return {
    items: results,
    totalTaxableAmount: roundCurrency(results.reduce((s, r) => s + r.taxableAmount, 0)),
    totalGstAmount: roundCurrency(results.reduce((s, r) => s + r.gstAmount, 0)),
    totalCgst: roundCurrency(results.reduce((s, r) => s + r.cgstAmount, 0)),
    totalSgst: roundCurrency(results.reduce((s, r) => s + r.sgstAmount, 0)),
    totalIgst: roundCurrency(results.reduce((s, r) => s + r.igstAmount, 0)),
    totalAmount: roundCurrency(results.reduce((s, r) => s + r.finalAmount, 0)),
  };
}

export const SELLER_STATE = "Kerala";

export function getApparelGstRate(salePrice: number): number {
  return salePrice > 1000 ? 12 : 5;
}

export const HSN_CODES = {
  shirts: "6205",
  tshirts: "6109",
  pants: "6203",
  default: "6211",
} as const;

export function getHsnCode(categorySlug: string): string {
  const key = categorySlug.toLowerCase().replace(/s$/, "") as keyof typeof HSN_CODES;
  return HSN_CODES[key] || HSN_CODES.default;
}
