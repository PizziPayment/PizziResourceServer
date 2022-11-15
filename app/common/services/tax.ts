export function compute_tax(price: number, tax_percentage: number): number {
  return Math.round(price + price * (tax_percentage / 100))
}
