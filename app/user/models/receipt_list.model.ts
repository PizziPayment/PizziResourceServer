export class ReceiptModel {
  receipt_id: number
  shop_name: string
  shop_logo: string
  date: Date
  total_ttc: number
}

export type ReceiptListModel = Array<ReceiptModel>
