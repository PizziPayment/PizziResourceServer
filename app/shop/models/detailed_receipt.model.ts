export class Product {
  id: number
  product_name: string
  quantity: number
  price_unit: number
  warranty: string
  eco_tax: number
  discount: number
}

export class DetailedReceiptModel {
  products: Array<Product>
  creation_date: Date
  payment_type: string
  tva_percentage: number
  total_ht: number
  total_ttc: number
}
