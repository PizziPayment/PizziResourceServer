import { PaymentMethod } from 'pizzi-db'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class CreateTransactionRequestModel {
  static descriptor: ObjectDescriptor<Required<CreateTransactionRequestModel>> = {
    tva_percentage: { type: 'number', customValidator: withFieldValidator((value) => value > 0) },
    total_price: { type: 'string', customValidator: withFieldValidator((value) => !isNaN(parseFloat(value))) },
    payment_method: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPaymentMethod) },
    items: {
      type: 'array',
      arrayType: {
        shop_item_id: { type: 'number' },
        discount: { type: 'number' },
        eco_tax: { type: 'number' },
        quantity: { type: 'number' },
        warranty: { type: 'string' },
      },
    },
  }
  static validator: TypeValidator<Required<CreateTransactionRequestModel>> = new TypeValidator(this.descriptor)

  tva_percentage: number
  total_price: string
  payment_method: PaymentMethod
  items: Array<{
    shop_item_id: number
    discount: number
    eco_tax: number
    quantity: number
    warranty: string
  }>
}
