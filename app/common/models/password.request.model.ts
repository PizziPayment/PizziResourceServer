import { ObjectDescriptor, TypeValidator } from 'record-validator'

export default class RequestPasswordModel {
  static descriptor: ObjectDescriptor<RequestPasswordModel> = {
    password: { type: 'string' },
    new_password: { type: 'string' },
  }
  static validator: TypeValidator<RequestPasswordModel> = new TypeValidator(this.descriptor)

  password: string
  new_password: string
}
