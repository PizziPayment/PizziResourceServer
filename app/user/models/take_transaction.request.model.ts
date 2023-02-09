import { ObjectDescriptor, TypeValidator } from 'record-validator'

export default class TakeTransactionRequestModel {
  static descriptor: ObjectDescriptor<TakeTransactionRequestModel> = {
    id: { type: 'number' },
    token: { type: 'string' },
  }
  static validator: TypeValidator<TakeTransactionRequestModel> = new TypeValidator(this.descriptor)

  id: number
  token: string
}
