import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../services/error_handling'
import FieldValidationService from '../services/field_validation/field.validation.service'

export default class ChangeEmailValidationModel {
  static descriptor: ObjectDescriptor<ChangeEmailValidationModel> = {
    password: { type: 'string' },
    new_email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
  }
  static validator: TypeValidator<ChangeEmailValidationModel> = new TypeValidator(this.descriptor)

  password: string
  new_email: string
}
