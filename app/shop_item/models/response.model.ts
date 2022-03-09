import { ShopItemModel } from './shop_item.model'
import { ShopItemModel as DBShopItemModel } from 'pizzi-db'

export class ShopItemsResponseModel {
  constructor(items: Array<DBShopItemModel>) {
    this.items = items.map((item) => {
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        created_at: item.created_at,
      }
    })
  }

  items: Array<ShopItemModel>
}
