import { NextFunction, Request, Response } from 'express'
import { Filter, SortBy, Order } from '../models/retrieve.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'

export async function validShopItemsRetrieval(
  req: Request<unknown, unknown, unknown, Filter>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<void> {
  const errors: Array<string> = []

  if (req.query) {
    const default_filter = new Filter()

    if (req.query.sort_by !== undefined) {
      if (Object.values(SortBy).includes(req.query.sort_by as SortBy) == false) {
        errors.push('invalid value for sort_by query parameter ')
      }
    } else {
      req.query.sort_by = default_filter.sort_by
    }

    if (req.query.order !== undefined) {
      if (Object.values(Order).includes(req.query.order as Order) == false) {
        errors.push('invalid value for order query parameter')
      }
    } else {
      req.query.order = default_filter.order
    }

    if (req.query.page === undefined) {
      req.query.page = default_filter.page
    } else {
      if (req.query.page < 1) {
        errors.push('invalid value for page query parameter')
      }
    }

    if (req.query.nb_items === undefined) {
      req.query.nb_items = default_filter.nb_items
    } else {
      if (req.query.nb_items < 1) {
        errors.push('invalid value for nb_items query parameter')
      }
    }

    if (errors.length === 0) {
      return next()
    } else {
      res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    res.status(400).send(new ApiFailure(req.url, 'No query'))
  }
}
