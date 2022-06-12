import { ObjectDescriptor, TypeValidator } from "record-validator"
import { withFieldValidator } from "../../common/services/error_handling"

export class ShopItemCreationModel {
  static descriptor: ObjectDescriptor<ShopItemCreationModel> = {
    name: { type: 'string' },
    price: { type: 'string', customValidator: withFieldValidator((value) => !isNaN(parseFloat(value))) },
  }
  static validator: TypeValidator<ShopItemCreationModel> = new TypeValidator(this.descriptor)

  name: string
  price: string
}

export class ShopItemCreationRequestModel {
  static descriptor: ObjectDescriptor<ShopItemCreationRequestModel> = {
    items: { type: 'array', arrayType: ShopItemCreationModel.descriptor },
  }
  static validator: TypeValidator<ShopItemCreationRequestModel> = new TypeValidator(this.descriptor)

  items: Array<ShopItemCreationModel>
}
