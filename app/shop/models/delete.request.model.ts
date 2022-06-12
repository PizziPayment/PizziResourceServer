import { ObjectDescriptor, TypeValidator } from 'record-validator'

export default class DeleteRequestModel {
  static descriptor: ObjectDescriptor<DeleteRequestModel> = { password: { type: 'string' } }
  static validator: TypeValidator<DeleteRequestModel> = new TypeValidator(this.descriptor)

  password: string
}
