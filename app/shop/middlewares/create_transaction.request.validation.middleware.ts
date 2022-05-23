import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'
import CreateTransactionRequestModel from '../models/create_transaction.request.model'

export default function validCreateTransactionRequest(
  req: Request<unknown, unknown, CreateTransactionRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (typeof req.body.tva_percentage !== 'number' || req.body.tva_percentage < 0 || req.body.tva_percentage > 100) {
      errors.push('invalid "tva_percentage"')
    }
    if (typeof req.body.total_price !== 'string' || isNaN(Number(req.body.total_price))) {
      errors.push('invalid "total_price"')
    }
    if (typeof req.body.payment_method !== 'string' || !FieldValidationService.isValidPaymentMethod(req.body.payment_method)) {
      errors.push('invalid "payment_method"')
    }
    if (Array.isArray(req.body.items)) {
      req.body.items.map((item) => {
        //TODO: Validate the ids
        if (typeof item.shop_item_id !== 'number') {
          errors.push('invalid "items[].id"')
        }
        if (typeof item.discount !== 'number') {
          errors.push('invalid "items[].discount"')
        }
        if (typeof item.eco_tax !== 'number') {
          errors.push('invalid "items[].eco_tax"')
        }
        if (typeof item.quantity !== 'number') {
          errors.push('invalid "items[].quantity"')
        }
        if (typeof item.warranty !== 'string') {
          errors.push('invalid "items[].warranty"')
        }
      })
    } else {
      errors.push('invalid "items"')
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
