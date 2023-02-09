import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { CredentialsService, EncryptionService, TokenModel } from 'pizzi-db'
import FieldValidationService from '../services/field_validation/field.validation.service'
import { createResponseHandler } from '../services/error_handling'

interface PasswordRequest {
  password: string
}

export default async function validPassword(
  req: Request<unknown, unknown, PasswordRequest>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token', TokenModel>>,
  next: NextFunction,
): Promise<Response | void> {
  await CredentialsService.getCredentialFromId(res.locals.token.credential_id).match((credential) => {
    if (credential.password === EncryptionService.encrypt(req.body.password)) {
      return next()
    } else {
      return res.status(403).send(new ApiFailure(req.url, 'Invalid password'))
    }
  }, createResponseHandler(req, res))
}

interface ChangePasswordRequest {
  password: string
  new_password: string
}

export async function validChangePassword(
  req: Request<unknown, unknown, ChangePasswordRequest>,
  res: Response<ApiResponseWrapper<unknown>, Record<'token', TokenModel>>,
  next: NextFunction,
): Promise<Response | void> {
  await CredentialsService.getCredentialFromId(res.locals.token.credential_id).match((credential) => {
    const errors: Array<string> = []

    if (credential.password !== EncryptionService.encrypt(req.body.password)) {
      errors.push('invalid "password"')
    }
    if (FieldValidationService.isValidPassword(req.body.new_password) == false) {
      errors.push('invalid "new_password"')
    }

    if (errors.length === 0) {
      return next()
    } else {
      return res.status(403).send(new ApiFailure(req.url, errors.join(',')))
    }
  }, createResponseHandler(req, res))
}
