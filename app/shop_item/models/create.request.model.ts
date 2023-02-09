import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

export class ShopItemCreationModel {
  static descriptor: ObjectDescriptor<Required<ShopItemCreationModel>> = {
    name: { type: 'string' },
    price: { type: 'number', customValidator: withFieldValidator(Number.isInteger) },
    category: { type: 'string', required: false },
    color: { type: 'string', required: false },
  }
  static validator: TypeValidator<Required<ShopItemCreationModel>> = new TypeValidator(this.descriptor)

  name: string
  price: number
  category?: string
  color?: string
}

export class ShopItemCreationRequestModel {
  static descriptor: ObjectDescriptor<ShopItemCreationRequestModel> = {
    items: { type: 'array', arrayType: ShopItemCreationModel.descriptor },
  }
  static validator: TypeValidator<ShopItemCreationRequestModel> = new TypeValidator(this.descriptor)

  items: Array<ShopItemCreationModel>
}
