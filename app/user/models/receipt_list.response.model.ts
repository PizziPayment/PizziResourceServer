export class ReceiptModel {
  receipt_id: number
  shop_name: string
  shop_avatar_id?: number
  date: Date
  total_ttc: number
}

export type ReceiptListResponseModel = Array<ReceiptModel>
