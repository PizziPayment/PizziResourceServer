import { ObjectDescriptor, TypeValidator } from "record-validator"
import { withFieldValidator } from "../../common/services/error_handling"

export class ShopItemUpdateParamModel {
  id: number
}

export class ShopItemUpdateRequestModel {
  static descriptor: ObjectDescriptor<Required<ShopItemUpdateRequestModel>> = {
    name: { type: 'string', required: false },
    price: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(parseFloat(value))) },
  }
  static validator: TypeValidator<Required<ShopItemUpdateRequestModel>> = new TypeValidator(this.descriptor)

  name?: string
  price?: string
}
