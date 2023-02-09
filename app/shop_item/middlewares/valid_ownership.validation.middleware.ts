import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ErrorCause, ShopItemsService } from 'pizzi-db'
import { ShopItemUpdateParamModel, ShopItemUpdateRequestModel } from '../models/update.request.model'
import { createResponseHandler } from '../../common/services/error_handling'

export async function validShopItemOwnership(
  req: Request<ShopItemUpdateParamModel, unknown, ShopItemUpdateRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const error = `Shop item ${req.params.id} doesn't exist`

  await ShopItemsService.retrieveShopItemFromId(req.params.id).match((shop_item) => {
    const shop_id = (res.locals.credential as CredentialModel).shop_id

    if (shop_item.shop_id == shop_id && shop_item.enabled) {
      res.locals.shop_item = shop_item
      return next()
    } else {
      return res.status(404).send(new ApiFailure(req.url, error))
    }
  }, createResponseHandler(req, res, [[ErrorCause.ShopItemNotFound, 404, error]]))
}
