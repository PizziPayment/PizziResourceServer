import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

const FilterModelValues = ['latest', 'oldest', 'price_ascending', 'price_descending'] as const
export type FilterModel = typeof FilterModelValues[number]

export class ReceiptsListRequestModel {
  static descriptor: ObjectDescriptor<Required<ReceiptsListRequestModel>> = {
    filter: { type: 'string', required: false, customValidator: withFieldValidator((value) => FilterModelValues.includes(value)) },
    from: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
    to: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
  }
  static validator: TypeValidator<Required<ReceiptsListRequestModel>> = new TypeValidator(this.descriptor)

  filter?: FilterModel
  from?: string
  to?: string
}
