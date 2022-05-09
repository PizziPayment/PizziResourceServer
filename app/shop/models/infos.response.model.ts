import { ShopModel } from 'pizzi-db'

export default class InfosResponseModel {
  constructor(email: string, shop: ShopModel) {
    this.id = shop.id
    this.email = email
    this.name = shop.name
    this.phone = shop.phone
    this.address = shop.address
    this.zipcode = shop.zipcode
    this.description = shop.description
    this.website = shop.website
    this.instagram = shop.instagram
    this.twitter = shop.twitter
    this.facebook = shop.facebook
  }

  id: number
  email: string
  name: string
  phone: string
  address: string
  zipcode: number
  description: string
  website: string
  instagram: string
  twitter: string
  facebook: string
}
