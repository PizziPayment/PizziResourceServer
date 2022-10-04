export class Product {
  product_name: string
  quantity: number
  unit_price: number
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
