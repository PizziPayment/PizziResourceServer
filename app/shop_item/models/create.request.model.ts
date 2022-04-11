export class ShopItemCreationModel {
  name: string
  price: string
}

export class ShopItemCreationRequestModel {
  items: Array<ShopItemCreationModel>
}
