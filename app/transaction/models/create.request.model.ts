import { PaymentMethod } from 'pizzi-db'

export class TransactionCreationModel {
  receipt_id: number
  user_id: number | null
  shop_id: number
  payment_method: PaymentMethod
}
