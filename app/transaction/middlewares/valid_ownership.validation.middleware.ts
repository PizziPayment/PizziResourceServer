import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ErrorCause, TransactionsService } from 'pizzi-db'
import { NextFunction, Request, Response } from 'express'
import { createResponseHandler } from '../../common/services/error_handling'

export async function validTransactionOwnership(
  req: Request<{ id: number }, unknown, unknown>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const not_found = `Transaction ${req.params.id} doesn't exist`

  await TransactionsService.getTransactionById(req.params.id).match((transaction) => {
    const shop_id = (res.locals.credential as CredentialModel).shop_id

    if (transaction.shop_id !== shop_id) {
      return res.status(404).send(new ApiFailure(req.url, not_found))
    }
    if (transaction.state === 'validated') {
      return res.status(403).send(new ApiFailure(req.url, `A validated transaction can't be modified`))
    }

    res.locals.transaction = transaction
    return next()
  }, createResponseHandler(req, res, [[ErrorCause.TransactionNotFound, 404, not_found]]))
}
