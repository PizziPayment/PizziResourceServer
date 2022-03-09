export class ShopItemCreationModel {
  name: string
  price: number
}

export class ShopItemCreationRequestModel {
  items: Array<ShopItemCreationModel>
}
