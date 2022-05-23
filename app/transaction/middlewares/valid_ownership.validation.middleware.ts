import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, TransactionsService } from 'pizzi-db'
import { NextFunction, Request, Response } from 'express'

export async function validTransactionOwnership(
  req: Request<{ id: number }, unknown, unknown>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const shop_id = (res.locals.credential as CredentialModel).shop_id
  const maybe_transaction = await TransactionsService.getTransactionById(req.params.id)

  if (maybe_transaction.isOk() && maybe_transaction.value.shop_id == shop_id) {
    const transaction = maybe_transaction.value

    if (transaction.state === 'validated') {
      return res.status(403).send(new ApiFailure(req.url, `A validated transaction can't be modified`))
    } else {
      res.locals.transaction = transaction
      return next()
    }
  } else {
    return res.status(404).send(new ApiFailure(req.url, `Transaction ${req.params.id} doesn't exist`))
  }
}
