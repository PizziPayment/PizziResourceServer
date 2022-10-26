import { NextFunction, Request, Response } from 'express'
import { Err, Ok, Result } from 'neverthrow'
import { ClientsService, ErrorCause, TokensService } from 'pizzi-db'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { AuthErrorMsg, AuthKind, BasicAuth, BearerAuth } from '../models/authorization.model'
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

function parseAuthHeader(authorization: any, expected_auth_methods: Array<AuthKind>): Result<BearerAuth | BasicAuth, { code: number; message: string }> {
  if (typeof authorization !== 'string') {
    return new Err({ code: 400, message: AuthErrorMsg.InvalidAuthHeader })
  }

  const auth_header_parts = authorization.split(' ')
  if (auth_header_parts.length !== 2) {
    return new Err({ code: 400, message: AuthErrorMsg.InvalidAuthHeader })
  }

  const [type, token] = auth_header_parts
  let auth: BearerAuth | BasicAuth = null

  if (!expected_auth_methods.includes(type as AuthKind)) {
    return new Err({ code: 400, message: AuthErrorMsg.InvalidOrUnknownAuthMethod })
  }

  switch (type) {
    case 'Bearer':
      auth = {
        kind: AuthKind.Bearer,
        access_token: token,
      }
      break
    case 'Basic':
      const client_parts = Buffer.from(token, 'base64').toString('ascii').split(':')
      const [client_id, client_secret] = client_parts

      if (client_parts.length !== 2 || client_id === '' || client_secret === '') {
        return new Err({ code: 400, message: AuthErrorMsg.NoClientCredGiven })
      }

      auth = {
        kind: AuthKind.Basic,
        client_id: client_parts[0],
        client_secret: client_parts[1],
      }
      break
  }

  return new Ok(auth)
}
