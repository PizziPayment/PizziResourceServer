import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { CredentialModel, CredentialsService, TokenModel } from 'pizzi-db'

export default async function validShopTokenAffiliation(
  req: Request<unknown, unknown, void>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token' | 'credential', TokenModel | CredentialModel>>,
  next: NextFunction,
): Promise<void> {
  const maybe_credential = await CredentialsService.getCredentialFromId((res.locals.token as TokenModel).credential_id)

  if (maybe_credential.isOk() && maybe_credential.value.shop_id) {
    res.locals.credential = maybe_credential.value
    return next()
  } else {
    res.status(400).send(new ApiFailure(req.url, 'Token not affiliated to a shop'))
  }
}
