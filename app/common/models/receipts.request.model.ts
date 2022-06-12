import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../services/error_handling'

export const FilterModelValues = ['latest', 'oldest', 'price_ascending', 'price_descending']
type FilterModel = typeof FilterModelValues[number]

export class ReceiptsListRequestModel {
  static descriptor: ObjectDescriptor<ReceiptsListRequestModel> = {
    filter: { type: 'string', required: false, customValidator: withFieldValidator(FilterModelValues.includes) },
    query: { type: 'string', required: false },
    time_interval: {
      type: 'object',
      required: false,
      value: {
        from: { type: 'string', required: false, customValidator: withFieldValidator((value) => Date.parse(value) !== NaN) },
        to: { type: 'string', required: false, customValidator: withFieldValidator((value) => Date.parse(value) !== NaN) },
      },
    },
  }
  static validator: TypeValidator<ReceiptsListRequestModel> = new TypeValidator(this.descriptor)

  filter: FilterModel
  query: string
  time_interval: {
    from: string
    to: string
  }
}

export class ReceiptDetailsRequestModel {
  receipt_id: number
}
