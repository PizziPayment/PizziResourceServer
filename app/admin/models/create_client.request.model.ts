import { ObjectDescriptor, TypeValidator } from 'record-validator'

export class CreateClientRequestModel {
  static descriptor: ObjectDescriptor<CreateClientRequestModel> = {
    client_id: { type: 'string' },
  }
  static validator: TypeValidator<CreateClientRequestModel> = new TypeValidator(this.descriptor)

  client_id: string
}
