import { ShopModel } from 'pizzi-db'

export default class InfosResponseModel {
  constructor(email: string, shop: ShopModel) {
    this.id = shop.id
    this.email = email
    this.name = shop.name
    this.phone = shop.phone
    this.address = shop.address
    this.city = shop.city
    this.zipcode = shop.zipcode
    this.siret = String(shop.siret).padStart(14, '0')
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
  city: string
  zipcode: number
  siret: string
  description: string
  website: string
  instagram: string
  twitter: string
  facebook: string
}
