import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import PatchRequestModel from '../../user/models/patch.request.model'
import { CredentialModel, CredentialsService, ErrorCause, TokenModel } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

export default async function validUserTokenAffiliation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token' | 'credential', TokenModel | CredentialModel>>,
  next: NextFunction,
): Promise<Response | void> {
  const error = 'Token not affiliated to a user'

  await CredentialsService.getCredentialFromId((res.locals.token as TokenModel).credential_id).match((credential) => {
    if (credential.user_id) {
      res.locals.credential = credential
      return next()
    } else {
      return res.status(400).send(new ApiFailure(req.url, error))
    }
  }, createResponseHandler(req, res, [[ErrorCause.CredentialNotFound, 400, error]]))
}
