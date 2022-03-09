import { ShopModel } from 'pizzi-db'

export default class InfosResponseModel {
  constructor(email: string, shop: ShopModel) {
    this.email = email
    this.name = shop.name
    this.phone = shop.phone
    this.address = shop.address
    this.zipcode = shop.zipcode
  }

  email: string
  name: string
  phone: string
  address: string
  zipcode: number
}
