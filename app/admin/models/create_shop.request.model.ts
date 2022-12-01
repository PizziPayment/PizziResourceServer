import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class CreateShopRequestModel {
  static descriptor: ObjectDescriptor<CreateShopRequestModel> = {
    name: { type: 'string' },
    email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
    phone: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPhone) },
    siret: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidSiret) },
    place: {
      type: 'object',
      value: {
        address: { type: 'string' },
        city: { type: 'string' },
        zipcode: { type: 'number' },
      },
    },
  }
  static validator: TypeValidator<CreateShopRequestModel> = new TypeValidator(this.descriptor)

  name: string
  phone: string
  siret: string
  email: string
  password: string
  place: {
    address: string
    city: string
    zipcode: number
  }
}
