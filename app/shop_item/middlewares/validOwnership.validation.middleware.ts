import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ShopItemsService } from 'pizzi-db'
import { ShopItemUpdateParamModel, ShopItemUpdateRequestModel } from '../models/update.request.model'

export async function validShopItemOwnership(
  req: Request<ShopItemUpdateParamModel, unknown, ShopItemUpdateRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<void> {
  const shop_id = (res.locals.credential as CredentialModel).shop_id
  const maybe_shop_item = await ShopItemsService.retrieveShopItemFromId(req.params.id)

  if (maybe_shop_item.isOk() && maybe_shop_item.value.shop_id == shop_id) {
    const shop_item = maybe_shop_item.value

    if (shop_item.enabled == false) {
      res.status(403).send(new ApiFailure(req.url, `Shop ${shop_id} can't modify shop item ${shop_item.name} (${shop_item.id})`))
    } else {
      res.locals.shop_item = shop_item
      return next()
    }
  } else {
    res.status(404).send(new ApiFailure(req.url, `Shop item ${req.params.id} doesn't exist`))
  }
}
