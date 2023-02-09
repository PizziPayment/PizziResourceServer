import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export class CreateAdminRequestModel {
  static descriptor: ObjectDescriptor<CreateAdminRequestModel> = {
    email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
  }
  static validator: TypeValidator<CreateAdminRequestModel> = new TypeValidator(this.descriptor)

  email: string
  password: string
}
