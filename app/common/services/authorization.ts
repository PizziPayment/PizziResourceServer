import { Err, Ok, Result } from 'neverthrow'
import { AuthErrorMsg, AuthKind, BasicAuth, BearerAuth } from '../models/authorization.model'

export function parseAuthHeader(authorization: any, expected_auth_methods: Array<AuthKind>): Result<BearerAuth | BasicAuth, { code: number; message: string }> {
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
