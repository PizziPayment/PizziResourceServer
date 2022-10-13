export class Product {
  product_name: string
  quantity: number
  unit_price: number
  warranty: string
  eco_tax: number
  discount: number
}

export class DetailedReceiptModel {
  vendor: {
    logo: string
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
  tva_percentage: number
  total_ht: number
  total_ttc: number
}
