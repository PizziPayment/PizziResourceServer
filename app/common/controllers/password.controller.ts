import { Request, Response } from 'express'
import RequestPasswordModel from '../models/password.request.model'
import { CredentialsService, TokenModel, EncryptionService } from 'pizzi-db'
import { ApiFailure } from '../../common/models/api.response.model'

export default async function changePassword(
  req: Request<unknown, unknown, RequestPasswordModel>,
  res: Response<unknown, Record<string, TokenModel>>,
): Promise<void> {
  const cred_id = res.locals.token.credential_id

  await CredentialsService.changePassword(cred_id, EncryptionService.encrypt(req.body.new_password)).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
