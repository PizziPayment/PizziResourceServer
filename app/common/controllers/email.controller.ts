import { Request, Response } from 'express'
import ChangeEmailValidationModel from '../models/email.request.model'
import { CredentialsService, TokenModel } from 'pizzi-db'
import { ApiFailure } from '../models/api.response.model'

export default async function changeEmail(
  req: Request<unknown, unknown, ChangeEmailValidationModel>,
  res: Response<unknown, Record<string, TokenModel>>,
): Promise<void> {
  const cred_id = res.locals.token.credential_id

  await CredentialsService.changeEmail(cred_id, req.body.new_email).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
