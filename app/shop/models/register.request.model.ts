import PlaceModel from './place.model'
import CredentialModel from './credential.model'

export default class RegisterRequestModel extends CredentialModel {
  name: string
  place: PlaceModel
  phone: string
  siret: number
}
