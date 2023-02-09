import { Request, Response } from 'express'
import ChangeEmailValidationModel from '../models/email.request.model'
import { CredentialsService, TokenModel } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

export default async function changeEmail(
  req: Request<unknown, unknown, ChangeEmailValidationModel>,
  res: Response<unknown, Record<string, TokenModel>>,
): Promise<void> {
  const cred_id = res.locals.token.credential_id

  await CredentialsService.changeEmailAndPassword(cred_id, req.body.new_email).match(() => res.status(204).send(), createResponseHandler(req, res))
}
