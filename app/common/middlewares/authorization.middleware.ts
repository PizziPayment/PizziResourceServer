import { NextFunction, Request, Response } from 'express'
import { ClientsService, ErrorCause, TokensService } from 'pizzi-db'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { AuthErrorMsg, AuthKind, BasicAuth, BearerAuth } from '../models/authorization.model'
import { parseAuthHeader } from '../services/authorization'
import { createResponseHandler } from '../services/error_handling'

export async function validAccessToken(req: Request, res: Response<ApiResponseWrapper<unknown>>, next: NextFunction): Promise<void> {
  parseAuthHeader(req.headers.authorization, [AuthKind.Bearer]).match(
    async (auth) => {
      let { kind: _, access_token } = auth as BearerAuth

      TokensService.getTokenFromAccessValue(access_token).match((token) => {
        if (token.access_expires_at.getTime() > new Date().getTime()) {
          res.locals.token = token
          next()
        } else {
          res.status(401).send(new ApiFailure(req.url, AuthErrorMsg.ExpiredToken))
        }
      }, createResponseHandler(req, res, [[ErrorCause.TokenNotFound, 401, AuthErrorMsg.InvalidToken]]))
    },
    async ({ code, message }) => {
      res.status(code).send(new ApiFailure(req.url, message))
    },
  )
}

export async function validBasicAuth(req: Request, res: Response<ApiResponseWrapper<unknown>>, next: NextFunction): Promise<void> {
  parseAuthHeader(req.headers.authorization, [AuthKind.Basic]).match(
    async (auth) => {
      let { kind: _, client_id, client_secret } = auth as BasicAuth

      await ClientsService.getClientFromIdAndSecret(client_id, client_secret).match(
        (_) => {
          next()
        },
        (_) => {
          res.status(401).send(new ApiFailure(req.url, AuthErrorMsg.InvalidCred))
        },
      )
    },
    async ({ code, message }) => {
      res.status(code).send(new ApiFailure(req.url, message))
    },
  )
}
