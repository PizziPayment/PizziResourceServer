import { Request, Response } from 'express'
import PatchRequestPasswordModel from '../models/password.request.model'
import { CredentialsService, TokenModel } from 'pizzi-db'
import { ApiFailure } from '../../common/models/api.response.model'

export async function changeUserPassword(
  req: Request<unknown, unknown, PatchRequestPasswordModel>,
  res: Response<unknown, Record<string, TokenModel>>,
): Promise<void> {
  const cred_id = res.locals.token.credential_id

  await CredentialsService.changePassword(cred_id, req.body.password).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
