import { PaymentMethod } from 'pizzi-db'

export class TransactionUserUpdateModel {
  user_id: number
}

export class TransactionPaymentMethodUpdateModel {
  payment_method: PaymentMethod
}
