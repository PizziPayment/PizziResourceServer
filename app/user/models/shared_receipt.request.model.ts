import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

const FilterModelValues = ['latest', 'oldest'] as const
export type SharedReceiptListFilterModel = typeof FilterModelValues[number]

export class SharedReceiptsListRequestModel {
  static descriptor: ObjectDescriptor<Required<SharedReceiptsListRequestModel>> = {
    filter: { type: 'string', required: false, customValidator: withFieldValidator((value) => FilterModelValues.includes(value)) },
    query: { type: 'string', required: false },
    from: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
    to: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
  }
  static validator: TypeValidator<Required<SharedReceiptsListRequestModel>> = new TypeValidator(this.descriptor)

  filter?: SharedReceiptListFilterModel
  query?: string
  from?: string
  to?: string
}
