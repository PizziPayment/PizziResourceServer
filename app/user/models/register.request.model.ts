import PlaceModel from './place.model'
import CredentialModel from './credential.model'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'
import { withFieldValidator } from '../../common/services/error_handling'

export default class RegisterRequestModel implements CredentialModel {
  static descriptor: ObjectDescriptor<RegisterRequestModel> = {
    name: { type: 'string' },
    surname: { type: 'string' },
    place: { type: 'object', value: PlaceModel.descriptor },
    email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
  }
  static validator: TypeValidator<RegisterRequestModel> = new TypeValidator(this.descriptor)

  email: string
  password: string
  name: string
  surname: string
  place: PlaceModel
}
