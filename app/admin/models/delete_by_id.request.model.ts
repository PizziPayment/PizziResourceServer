import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

export class DeleteByIdRequestModel {
  static descriptor: ObjectDescriptor<DeleteByIdRequestModel> = {
    id: { type: 'string', customValidator: withFieldValidator((value) => !isNaN(Number(value))) },
  }
  static validator: TypeValidator<DeleteByIdRequestModel> = new TypeValidator(this.descriptor)

  id: string
}
