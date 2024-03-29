export class Product {
  product_name: string
  quantity: number
  unit_price: number
  tva_percentage: number
  warranty: string
  eco_tax: number
  discount: number
}

export class DetailedReceiptModel {
  vendor: {
    avatar_id?: number
    name: string
    place: {
      street: string
      city: string
      postal_code: number
    }
    siret: string
    shop_number: string
  }
  products: Array<Product>
  creation_date: Date
  payment_type: string
  total_ht: number
  total_ttc: number
}
