export enum AuthErrorMsg {
  // Bearer
  ExpiredToken = 'Expired token',
  InvalidToken = 'Invalid token',

  // Basic
  InvalidCred = 'Invalid client_id or client_secret',
  NoClientCredGiven = 'No client credentials given',

  // Parsing
  InvalidAuthHeader = 'Invalid authorization header',
  InvalidOrUnknownAuthMethod = 'Invalid or unknown authorization method',
}

export enum AuthKind {
  Basic = 'Basic',
  Bearer = 'Bearer',
}

export class BasicAuth {
  kind: AuthKind
  client_id: string
  client_secret: string
}

export class BearerAuth {
  kind: AuthKind
  access_token: string
}
