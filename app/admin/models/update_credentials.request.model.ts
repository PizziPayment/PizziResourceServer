import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class UpdateCredentialsRequestModel {
  static descriptor: ObjectDescriptor<Required<UpdateCredentialsRequestModel>> = {
    id: { type: 'number' },
    email: { type: 'string', required: false, customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', required: false, customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
  }
  static validator: TypeValidator<Required<UpdateCredentialsRequestModel>> = new TypeValidator(this.descriptor)

  id: number
  email?: string
  password?: string
}
