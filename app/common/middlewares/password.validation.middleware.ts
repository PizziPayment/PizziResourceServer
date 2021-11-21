import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { CredentialsService, EncryptionService, TokenModel } from 'pizzi-db'

interface PasswordRequest {
  password: string
}

export default async function validPassword(
  req: Request<unknown, unknown, PasswordRequest>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token', TokenModel>>,
  next: NextFunction,
): Promise<Response | void> {
  const credential = await CredentialsService.getCredentialFromId(res.locals.token.credential_id)

  if (credential.isOk()) {
    if (credential.value.password === EncryptionService.encrypt(req.body.password)) {
      return next()
    } else {
      return res.status(403).send(new ApiFailure(req.url, 'Invalid password'))
    }
  } else {
    return res.status(500).send(new ApiFailure(req.url, 'Internal Server Error'))
  }
}
