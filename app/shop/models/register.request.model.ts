import PlaceModel from './place.model'
import CredentialModel from './credential.model'
import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default class RegisterRequestModel extends CredentialModel {
  static descriptor: ObjectDescriptor<RegisterRequestModel> = {
    name: { type: 'string' },
    place: { type: 'object', value: PlaceModel.descriptor },
    email: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidEmail) },
    password: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPassword) },
    phone: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidPhone) },
    siret: { type: 'string', customValidator: withFieldValidator(FieldValidationService.isValidSiret) },
  }
  static validator: TypeValidator<RegisterRequestModel> = new TypeValidator(this.descriptor)

  name: string
  place: PlaceModel
  phone: string
  siret: string
}
