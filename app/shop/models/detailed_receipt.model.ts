export class Product {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  tva_percentage: number
  warranty: string
  eco_tax: number
  discount: number
}

export class DetailedReceiptModel {
  products: Array<Product>
  creation_date: Date
  payment_type: string
  total_ht: number
  total_ttc: number
}
