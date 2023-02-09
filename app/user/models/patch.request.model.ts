import { ObjectDescriptor, TypeValidator } from 'record-validator'
import PlaceModel from './place.model'

export default class PatchRequestModel {
  static descriptor: ObjectDescriptor<PatchRequestModel> = {
    name: { type: 'string', required: false },
    surname: { type: 'string', required: false },
    place: { type: 'object', required: false, value: PlaceModel.descriptor },
  }
  static validator: TypeValidator<PatchRequestModel> = new TypeValidator(this.descriptor)

  name: string
  surname: string
  place: PlaceModel
}
