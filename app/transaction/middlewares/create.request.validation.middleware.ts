import { NextFunction, Request, Response } from 'express'
import { TransactionCreationModel } from '../models/create.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { PaymentMethod } from 'pizzi-db'

export default function validCreateRequest(
  req: Request<unknown, unknown, TransactionCreationModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []
  const isValidPaymentMethod = (method: string | PaymentMethod) => method === 'card' || method === 'cash' || method === 'unassigned'

  if (req.body) {
    if (!req.body.receipt_id) {
      errors.push('invalid "receipt_id"')
    }
    if (!req.body.payment_method || !isValidPaymentMethod(req.body.payment_method)) {
      errors.push('invalid "receipt_id"')
    }
    if (errors.length === 0) {
      return next()
    } else {
      return res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    return res.status(400).send(new ApiFailure(req.url, 'Invalid transaction creation request'))
  }
}
