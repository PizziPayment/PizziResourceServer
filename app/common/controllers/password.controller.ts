import { Request, Response } from 'express'
import RequestPasswordModel from '../models/password.request.model'
import { CredentialsService, TokenModel, EncryptionService } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

export default async function changePassword(
  req: Request<unknown, unknown, RequestPasswordModel>,
  res: Response<unknown, Record<string, TokenModel>>,
): Promise<void> {
  const cred_id = res.locals.token.credential_id

  await CredentialsService.changePassword(cred_id, EncryptionService.encrypt(req.body.new_password)).match(
    () => res.status(204).send(),
    createResponseHandler(req, res),
  )
}
