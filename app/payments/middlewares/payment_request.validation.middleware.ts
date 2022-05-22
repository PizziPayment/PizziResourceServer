import { PaymentRequestModel } from '../models/payment.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { NextFunction, Request, Response } from 'express'
import { TransactionsService } from 'pizzi-db'

async function isValidTransactionId(transaction_id: number): Promise<boolean> {
  return (await TransactionsService.getTransactionById(transaction_id)).isOk()
}

export default async function validPaymentRequest(
  req: Request<unknown, unknown, PaymentRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.transaction_id || !(await isValidTransactionId(req.body.transaction_id))) {
      errors.push('invalid "transaction_id"')
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
