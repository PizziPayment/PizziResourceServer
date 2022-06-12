import { PaymentMethod } from 'pizzi-db'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export class TransactionUserUpdateModel {
  static descriptor: ObjectDescriptor<TransactionUserUpdateModel> = {
    user_id: { type: 'number' }
  }
  static validator: TypeValidator<TransactionUserUpdateModel> = new TypeValidator(this.descriptor)

  user_id: number
}

export class TransactionPaymentMethodUpdateModel {
  static descriptor: ObjectDescriptor<TransactionPaymentMethodUpdateModel> = {
    payment_method: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPaymentMethod) }
  }
  static validator: TypeValidator<TransactionPaymentMethodUpdateModel> = new TypeValidator(this.descriptor)

  payment_method: PaymentMethod
}
