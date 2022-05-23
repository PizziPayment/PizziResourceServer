import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, TokenModel, TransactionTokensService } from 'pizzi-db'
import TakeTransactionRequestModel from '../models/take_transaction.request.model'

export default async function validTakeTransactionRequest(
  req: Request<void, void, TakeTransactionRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, { token: TokenModel; credential: CredentialModel }>,
  next: NextFunction,
): Promise<void> {
  return await TransactionTokensService.getTransactionTokenByTransactionIdAndToken(req.body.id, req.body.token).match(
    () => next(),
    () => res.status(400).send(new ApiFailure(req.url, 'Invalid transaction id or token')),
  )
}
