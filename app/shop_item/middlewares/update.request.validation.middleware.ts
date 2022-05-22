import { NextFunction, Request, Response } from 'express'
import { ShopItemModel } from 'pizzi-db'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { ShopItemUpdateParamModel, ShopItemUpdateRequestModel } from '../models/update.request.model'

export async function validShopItemUpdate(
  req: Request<ShopItemUpdateParamModel, unknown, ShopItemUpdateRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<void> {
  const errors: Array<string> = []

  if (req.body) {
    if (req.body.name === undefined && req.body.price === undefined) {
      errors.push('at least one field is require to update a shop item')
    } else {
      if (req.body.price !== undefined && isNaN(parseFloat(req.body.price))) {
        errors.push('price needs to be a float')
      } else {
        const shop_item = res.locals.shop_item as ShopItemModel

        if (
          !(req.body.name !== undefined && shop_item.name !== req.body.name) &&
          !(req.body.price !== undefined && parseFloat(req.body.price) !== parseFloat(shop_item.price))
        ) {
          errors.push('at least one field must be different to change an item information')
        }
      }
    }

    if (errors.length === 0) {
      return next()
    } else {
      res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    res.status(400).send(new ApiFailure(req.url, 'No body'))
  }
}
