import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class ShareReceiptRequestModel {
  static descriptor: ObjectDescriptor<ShareReceiptRequestModel> = {
    recipient_email: {
      type: 'string',
      customValidator: withFieldValidator(FieldValidationService.isValidEmail),
    },
  }
  static validator: TypeValidator<ShareReceiptRequestModel> = new TypeValidator(this.descriptor)

  recipient_email: string
}
