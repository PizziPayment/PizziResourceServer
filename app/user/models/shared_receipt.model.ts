export interface DetailedSharedReceiptModel {
  id: number
  user: { firstname: string; surname: string; avatar_id?: number }
  receipt: {
    id: number
    total_price: number
    items: Array<{
      id: number
      name: string
      price: number
      tva_percentage: number
      quantity: number
      warranty: string
      eco_tax: number
      discount: number
    }>
  }
  shared_at: Date
}
