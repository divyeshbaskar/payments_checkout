/**
 * Currency display formatter.
 * Note: Internal state, calculations, and API transfers ALWAYS use integer paise.
 * This formatter converts integer paise to INR currency display string only at render time.
 */
export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}
