export class Product {
  productName: string
  quantity: number
  priceUnit: number
  warranty: string
  ecoTax: number
  discount: number
}

export default class Receipt {
  vendor: {
    logo: string
    name: string
    address: {
      street: string
      city: string
      postalCode: string
    }
    siret: string
    shopNumber: string
  }
  products: Array<Product>
  creationDate: string
  paymentType: string
  tvaPercentage: number
  totalHt: number
  totalTtc: number
}
