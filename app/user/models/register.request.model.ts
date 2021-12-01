import PlaceModel from './place.model'
import CredentialModel from './credential.model'

export default class RegisterRequestModel extends CredentialModel {
  name: string
  surname: string
  password: string
  place: PlaceModel
}
