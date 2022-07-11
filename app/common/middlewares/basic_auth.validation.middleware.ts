import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { ClientsService, ErrorCause } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

export default async function validBasicAuth(req: Request, res: Response<ApiResponseWrapper<unknown>>, next: NextFunction): Promise<Response | void> {
  const authorization_type = req.headers.authorization?.split(' ')

  if (authorization_type && authorization_type.length === 2 && authorization_type[0] === 'Basic') {
    const [client_id, client_secret] = Buffer.from(authorization_type[1], 'base64').toString('ascii').split(':')

    return await ClientsService.getClientFromIdAndSecret(client_id, client_secret).match((client) => {
      res.locals.client = client
      return next()
    }, createResponseHandler(req, res, [[ErrorCause.ClientNotFound, 401, 'Invalid client credentials']]))
  }
  return res.status(400).send(new ApiFailure(req.url, 'No client credentials given'))
}
