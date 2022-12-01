import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class CreateUserRequestModel {
  static descriptor: ObjectDescriptor<CreateUserRequestModel> = {
    name: { type: 'string' },
    surname: { type: 'string' },
    email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
    place: {
      type: 'object',
      value: {
        address: { type: 'string' },
        city: { type: 'string' },
        zipcode: { type: 'number' },
      },
    },
  }
  static validator: TypeValidator<CreateUserRequestModel> = new TypeValidator(this.descriptor)

  name: string
  surname: string
  email: string
  password: string
  place: {
    address: string
    city: string
    zipcode: number
  }
}
