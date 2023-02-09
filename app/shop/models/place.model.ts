import { ObjectDescriptor } from 'record-validator'

export default class PlaceModel {
  static descriptor: ObjectDescriptor<PlaceModel> = {
    address: { type: 'string' },
    city: { type: 'string' },
    zipcode: { type: 'number' },
  }

  address: string
  city: string
  zipcode: number
}
