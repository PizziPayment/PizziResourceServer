import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../services/error_handling'

export class ReceiptDetailsRequestModel {
  static descriptor: ObjectDescriptor<ReceiptDetailsRequestModel> = {
    receipt_id: {
      type: 'string',
      customValidator: withFieldValidator((value) => !isNaN(Number(value))),
    },
  }
  static validator: TypeValidator<ReceiptDetailsRequestModel> = new TypeValidator(this.descriptor)

  receipt_id: string
}
