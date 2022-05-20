export const FilterModelValues = ['latest', 'oldest', 'price_ascending', 'price_descending']
type FilterModel = typeof FilterModelValues[number]

export class ReceiptsListRequestModel {
  filter: FilterModel
  query: string
  time_interval: {
    from: number
    to: number
  }
}

export class ReceiptDetailsRequestModel {
  receipt_id: number
}
