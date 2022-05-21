import { PaymentMethod, TransactionModel, TransactionState } from 'pizzi-db'

export class TransactionResponseModel {
  id: number
  payment_method: PaymentMethod
  receipt_id: number
  shop_id: number
  state: TransactionState
  user_id: number | null
  created_at: Date

  constructor(transaction: TransactionModel) {
    this.id = transaction.id
    this.payment_method = transaction.payment_method
    this.shop_id = transaction.shop_id
    this.state = transaction.state
    this.user_id = transaction.user_id
    this.created_at = transaction.created_at
    this.receipt_id = transaction.receipt_id
  }
}
