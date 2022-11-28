export interface DetailedSharedReceiptModel {
  id: number
  shop: { id: number; name: string; avatar_id?: number }
  user: { firstname: string; surname: string; avatar_id?: number }
  receipt: {
    id: number
    total_price: number
  }
  shared_at: Date
}
