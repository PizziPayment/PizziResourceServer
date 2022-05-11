import FilterModel from "./filter.model"

export default class ReceiptsRequestModel {
  filter: FilterModel
  query: string
  time_interval: {
    from: number
    to: number
  }
}
