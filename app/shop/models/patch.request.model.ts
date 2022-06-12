import { ShopUpdateModel } from 'pizzi-db'
import { ObjectDescriptor, TypeValidator } from 'record-validator'

export class PatchRequestModel {
  static descriptor: ObjectDescriptor<Required<PatchRequestModel>> = {
    description: { type: 'string', required: false },
    website: { type: 'string', required: false },
    instagram: { type: 'string', required: false },
    twitter: { type: 'string', required: false },
    facebook: { type: 'string', required: false },
  }
  static validator: TypeValidator<Required<PatchRequestModel>> = new TypeValidator(this.descriptor)

  description?: string
  website?: string
  instagram?: string
  twitter?: string
  facebook?: string
}

export function intoShopUpdateModel(model: PatchRequestModel): ShopUpdateModel {
  return {
    description: model.description,
    website: model.website,
    instagram: model.instagram,
    twitter: model.twitter,
    facebook: model.facebook,
  }
}
