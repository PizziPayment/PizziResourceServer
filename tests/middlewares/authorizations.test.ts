import { NextFunction, Request, Response } from 'express'
import { validAccessToken, validBasicAuth } from '../../app/common/middlewares/authorization.middleware'
import { AuthErrorMsg } from '../../app/common/models/authorization.model'
import { rewriteTables, ClientsService } from 'pizzi-db'
import { config } from '../../app/common/config'
import { client, users, client_header } from '../common/models'
import { createBearerHeaderFromCredential, createUser, getUserToken } from '../common/services'
import { ApiFailure } from '../../app/common/models/api.response.model'

// @ts-ignore
let sequelize: Sequelize = undefined
let should_wait = false

beforeEach(async () => {
  const database = config.database
  const orm_config = {
    user: database.user,
    password: database.password,
    name: database.name,
    host: database.host,
    port: Number(database.port),
    logging: false,
  }

  sequelize = await rewriteTables(orm_config)
  should_wait = true
})

afterEach(async () => {
  await sequelize.close()
})

const user = users[0]

function setup() {
  let req: Partial<Request> = { url: '/' }
  let res: Partial<Response> = { locals: {}, status: jest.fn().mockReturnThis() }
  let next = jest.fn()
  res.send = jest.fn(() => {
    should_wait = false
    return res as Response
  })

  return { req, res, next }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function wait_for_promises_to_resolve(ms: number = 250) {
  while (should_wait) {
    await sleep(ms)
  }
}

describe('validAccessToken middleware', () => {
  it('should approve a valid token', async () => {
    let { req, res, next } = setup()
    await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
    await createUser(user)
    let auth_header = (await createBearerHeaderFromCredential(user.email, user.password)).Authorization
    req = {
      headers: {
        authorization: auth_header,
      },
    }
    next = jest.fn(() => {
      should_wait = false
    })
    await validAccessToken(req as Request, res as Response, next)
    await wait_for_promises_to_resolve()
    expect(next).toHaveBeenCalledTimes(1)
  }, 2500)

  const data: Array<[string, string | undefined, number, AuthErrorMsg]> = [
    ['without the authorization header', undefined, 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an empty authorization header', '', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an invalid authorization header (0 split)', 'Bearer', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an invalid authorization header (2 splits)', 'Blouga b907c23b-c42d-4a3a-a8ea-dd75d706d4e6 token', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an unauthorization method', client_header().Authorization, 400, AuthErrorMsg.InvalidOrUnknownAuthMethod],
    ['with an invalid token', 'Bearer b907c23b-c42d-4a3a-a8ea-dd75d706d4e6', 401, AuthErrorMsg.InvalidToken],
    ['with an invalid authorization method', 'Blouga token', 400, AuthErrorMsg.InvalidOrUnknownAuthMethod],
  ]
  it.each(data)(
    "should't validate a request %s",
    async (_, auth_header, expected_code, expected_message) => {
      let { req, res, next } = setup()

      req = {
        headers: {
          authorization: auth_header,
        },
      }

      await validAccessToken(req as Request, res as Response, next)
      await wait_for_promises_to_resolve()

      expect(res.status).toHaveBeenCalledWith(expected_code)
      expect(res.status).toHaveBeenCalledTimes(1)
      expect(res.send).toHaveBeenCalledTimes(1)
      expect(res.send).toHaveBeenCalledWith(new ApiFailure(req.url as string, expected_message))
    },
    2500,
  )

  it("shouldn't a request with an expired token", async () => {
    let { req, res, next } = setup()
    await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
    await createUser(user)
    let token = await getUserToken(user.email, user.password, new Date())

    req = {
      headers: {
        authorization: `Bearer ${token.access_token}`,
      },
    }

    await validAccessToken(req as Request, res as Response, next)
    await wait_for_promises_to_resolve()

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status).toHaveBeenCalledTimes(1)
    expect(res.send).toHaveBeenCalledTimes(1)
    expect(res.send).toHaveBeenCalledWith(new ApiFailure(req.url as string, AuthErrorMsg.ExpiredToken))
  }, 2500)
})

describe('validBasicAuth middleware', () => {
  it('should approve valid credentials', async () => {
    let { req, res, next } = setup()
    await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)

    req = {
      headers: {
        authorization: client_header().Authorization,
      },
    }
    next = jest.fn(() => {
      should_wait = false
    })

    await validBasicAuth(req as Request, res as Response, next)
    await wait_for_promises_to_resolve()
    expect(next).toHaveBeenCalledTimes(1)
  }, 2500)

  const data: Array<[string, string | undefined, number, AuthErrorMsg]> = [
    ['without the authorization header', undefined, 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an empty authorization header', '', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an invalid authorization header (0 split)', 'Basic', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an invalid authorization header (2 splits)', 'Basic b907c23b-c42d-4a3a-a8ea-dd75d706d4e6 token', 400, AuthErrorMsg.InvalidAuthHeader],
    ['with an unauthorization method', 'Bearer b907c23b-c42d-4a3a-a8ea-dd75d706d4e6', 400, AuthErrorMsg.InvalidOrUnknownAuthMethod],
    ['with invalid client credentials (without secret)', client_header(client.client_id, '').Authorization, 400, AuthErrorMsg.NoClientCredGiven],
    ['with invalid client credentials (without id)', client_header('', client.client_secret).Authorization, 400, AuthErrorMsg.NoClientCredGiven],
    ['with invalid client credentials', client_header(client.client_secret, client.client_id).Authorization, 401, AuthErrorMsg.InvalidCred],
    ['with an invalid authorization method', 'Blouga token', 400, AuthErrorMsg.InvalidOrUnknownAuthMethod],
  ]
  it.each(data)(
    "should't validate a request %s",
    async (_, auth_header, expected_code, expected_message) => {
      let { req, res, next } = setup()

      req = {
        headers: {
          authorization: auth_header,
        },
      }

      await validBasicAuth(req as Request, res as Response, next)
      await wait_for_promises_to_resolve()

      expect(res.status).toHaveBeenCalledWith(expected_code)
      expect(res.status).toHaveBeenCalledTimes(1)
      expect(res.send).toHaveBeenCalledTimes(1)
      expect(res.send).toHaveBeenCalledWith(new ApiFailure(req.url as string, expected_message))
    },
    2500,
  )
})
