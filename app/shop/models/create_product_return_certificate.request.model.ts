import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

export default class CreateProductReturnCertificateRequestModel {
  static descriptor: ObjectDescriptor<Required<CreateProductReturnCertificateRequestModel>> = {
    receipt_item_id: {
      type: 'number',
      customValidator: withFieldValidator(Number.isInteger),
    },
    quantity: {
      type: 'number',
      customValidator: withFieldValidator(Number.isInteger),
    },
  }
  static validator: TypeValidator<Required<CreateProductReturnCertificateRequestModel>> = new TypeValidator(this.descriptor)
  receipt_item_id: number
  quantity: number
}
