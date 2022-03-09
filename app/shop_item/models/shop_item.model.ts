export class ShopItemModel {
  name: string
  price: number
  created_at: Date
}

export class ShopItemModelId extends ShopItemModel {
  id: number
}
