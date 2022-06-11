import { NextFunction, Request, Response } from 'express'
import { ApiResponseWrapper } from '../models/api.response.model'
import { CredentialsService, ErrorCause } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

interface EmailRequest {
  email: string
}

export default async function validUniqueEmail(
  req: Request<unknown, unknown, EmailRequest>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  await CredentialsService.isEmailUnique(req.body.email).match(
    () => next(),
    createResponseHandler(req, res, [[ErrorCause.DuplicatedEmail, 400, 'Email already registered']]),
  )
}
