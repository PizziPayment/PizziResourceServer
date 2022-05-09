import { ShopUpdateModel } from 'pizzi-db'

export class PatchRequestModel {
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
