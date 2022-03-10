import { NextFunction, Request, Response } from 'express'
import { ShopItemCreationRequestModel } from '../models/create.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'

export async function validShopItemsCreation(
  req: Request<unknown, unknown, ShopItemCreationRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const errors: Array<string> = []

  if (req.body) {
    if (req.body.items === undefined || Array.isArray(req.body.items) == false) {
      errors.push('invalid items')
    } else {
      if (req.body.items.length === 0) {
        errors.push('not shop item provided in items')
      }

      for (const [i, item] of req.body.items.entries()) {
        if (item.name === undefined) {
          errors.push(`invalid name in item n#${i + 1}`)
        }
        if (item.price === undefined) {
          errors.push(`invalid price in item n#${i + 1}`)
        }
      }
    }

    if (errors.length === 0) {
      return next()
    } else {
      return res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    return res.status(400).send(new ApiFailure(req.url, 'No body'))
  }
}
