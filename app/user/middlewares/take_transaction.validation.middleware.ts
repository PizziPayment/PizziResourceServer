import { NextFunction, Request, Response } from 'express'
import { ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ErrorCause, TokenModel, TransactionTokensService } from 'pizzi-db'
import TakeTransactionRequestModel from '../models/take_transaction.request.model'
import { createResponseHandler } from '../../common/services/error_handling'

export default async function validTakeTransactionRequest(
  req: Request<void, void, TakeTransactionRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, { token: TokenModel; credential: CredentialModel }>,
  next: NextFunction,
): Promise<void> {
  return await TransactionTokensService.getTransactionTokenByTransactionIdAndToken(req.body.id, req.body.token).match(
    () => next(),
    createResponseHandler(req, res, [[ErrorCause.TransactionTokenNotFound, 400, 'Invalid transaction id or token']]),
  )
}
