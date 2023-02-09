import { ObjectDescriptor, TypeValidator } from 'record-validator'
import { withFieldValidator } from '../../common/services/error_handling'

export class GetPageRequestModel {
  static descriptor: ObjectDescriptor<Required<GetPageRequestModel>> = {
    page_nb: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
    items_nb: { type: 'string', required: false, customValidator: withFieldValidator((value) => !isNaN(Date.parse(value))) },
  }
  static validator: TypeValidator<Required<GetPageRequestModel>> = new TypeValidator(this.descriptor)

  page_nb?: string
  items_nb?: string
}

export class FinalGetPageRequestModel {
  static fromBaseModel(model: GetPageRequestModel): FinalGetPageRequestModel {
    return {
      page_nb: Number(model.page_nb) || 1,
      items_nb: Number(model.items_nb) || 25,
    }
  }

  page_nb: number
  items_nb: number
}
