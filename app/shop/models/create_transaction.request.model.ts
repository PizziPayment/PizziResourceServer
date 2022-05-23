import { PaymentMethod } from 'pizzi-db'

export default class CreateTransactionRequestModel {
  tva_percentage: number
  total_price: string
  payment_method: PaymentMethod
  items: Array<{
    shop_item_id: number
    discount: number
    eco_tax: number
    quantity: number
    warranty: string
  }>
}
