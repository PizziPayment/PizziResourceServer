import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import PatchRequestModel from '../../user/models/patch.request.model'
import { CredentialModel, CredentialsService, TokenModel } from 'pizzi-db'

export default async function validUserTokenAffiliation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token' | 'credential', TokenModel | CredentialModel>>,
  next: NextFunction,
): Promise<void> {
  const maybe_credential = await CredentialsService.getCredentialFromId((res.locals.token as TokenModel).credential_id)

  if (maybe_credential.isOk() && maybe_credential.value.user_id) {
    res.locals.credential = maybe_credential.value
    next()
  } else {
    res.status(400).send(new ApiFailure(req.url, 'Token not affiliated to a user'))
  }
}
