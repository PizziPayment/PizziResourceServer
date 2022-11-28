import { ShopItemModel } from './shop_item.model'
import { ShopItemModel as DBShopItemModel } from 'pizzi-db'

export class ShopItemResponseModel implements ShopItemModel {
  id: number
  name: string
  price: number
  created_at: Date
  category?: string
  color?: string

  constructor(item: DBShopItemModel) {
    this.id = item.id
    this.name = item.name
    this.price = item.price
    this.created_at = item.created_at
    this.category = item.category
    this.color = item.color
  }
}

export class ShopItemsResponseModel {
  constructor(items: Array<DBShopItemModel>) {
    this.items = items.map((item) => new ShopItemResponseModel(item))
  }

  items: Array<ShopItemResponseModel>
}
