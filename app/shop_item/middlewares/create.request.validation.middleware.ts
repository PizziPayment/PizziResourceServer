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
        const item_errors: Array<string> = []

        if (item.name === undefined) {
          item_errors.push(`the name (${item.name})`)
        }
        if (item.price === undefined || isNaN(parseFloat(item.price))) {
          item_errors.push(`the price (${item.price})`)
        }

        if (item_errors.length !== 0) {
          errors.push(`item nº${i + 1} is invalid because of ` + item_errors.join(' and '))
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
