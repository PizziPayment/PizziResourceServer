import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { ErrorCause, TokensService } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'

export default async function validToken(req: Request, res: Response<ApiResponseWrapper<unknown>>, next: NextFunction): Promise<Response | void> {
  const authorization_type = req.headers.authorization?.split(' ')

  if (authorization_type && authorization_type.length === 2 && authorization_type[0] === 'Bearer') {
    const access_token = authorization_type[1]

    return await TokensService.getTokenFromAccessValue(access_token).match((token) => {
      if (new Date(token.access_expires_at).getTime() > new Date().getTime()) {
        res.locals.token = token
        return next()
      } else {
        return res.status(401).send(new ApiFailure(req.url, 'Expired token'))
      }
    }, createResponseHandler(req, res, [[ErrorCause.TokenNotFound, 401, 'Invalid token']]))
  } else {
    return res.status(400).send(new ApiFailure(req.url, 'No token given'))
  }
}
