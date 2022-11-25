import { NextFunction, Request, Response } from 'express'
import { ApiFailure } from '../models/api.response.model'
import { CredentialsService, ErrorCause, TokenModel } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

// Having void as the third generic argument to Request is required to prevent
// the typing from breaking for half of the routes, for some reason

export async function validUserTokenAffiliation(req: Request<unknown, unknown, void>, res: Response, next: NextFunction): Promise<void> {
  validTokenAffiliation(req, res, next, 'user_id', 'user')
}

export async function validShopTokenAffiliation(req: Request<unknown, unknown, void>, res: Response, next: NextFunction): Promise<void> {
  validTokenAffiliation(req, res, next, 'shop_id', 'shop')
}

export async function validAdminTokenAffiliation(req: Request<unknown, unknown, void>, res: Response, next: NextFunction): Promise<void> {
  validTokenAffiliation(req, res, next, 'admin_id', 'admin')
}

async function validTokenAffiliation(
  req: Request<unknown, unknown, void>,
  res: Response,
  next: NextFunction,
  credential_type: 'user_id' | 'shop_id' | 'admin_id',
  name: string,
): Promise<void> {
  const error = `Token not affiliated to a ${name}`

  await CredentialsService.getCredentialFromId((res.locals.token as TokenModel).credential_id).match((credential) => {
    if (credential[credential_type]) {
      res.locals.credential = credential
      next()
    } else {
      res.status(400).send(new ApiFailure(req.url, error))
    }
  }, createResponseHandler(req, res, [[ErrorCause.CredentialNotFound, 400, error]]))
}
