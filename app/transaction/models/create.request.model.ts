import { PaymentMethod } from 'pizzi-db'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export class TransactionCreationModel {
  static descriptor: ObjectDescriptor<Required<TransactionCreationModel>> = {
    receipt_id: { type: 'number' },
    user_id: { type: 'number', required: false },
    payment_method: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPaymentMethod) },
  }
  static validator: TypeValidator<Required<TransactionCreationModel>> = new TypeValidator(this.descriptor)

  receipt_id: number
  user_id?: number
  payment_method: PaymentMethod
}
