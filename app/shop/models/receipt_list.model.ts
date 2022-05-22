export class ReceiptModel {
  receipt_id: number
  date: Date
  total_ttc: number
}

export type ReceiptListModel = Array<ReceiptModel>
