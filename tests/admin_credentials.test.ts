import { ClientModel, ClientsService, CredentialsService, EncryptionService, rewriteTables } from 'pizzi-db'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { App } from '../app/api'
import { baseUrlUsers, baseUrlCredentials } from '../app/admin/routes.config'
import { admin, client, users } from './common/models'
import { createAdmin, createBearerHeader, getAdminToken } from './common/services'
import { ClientResponseModel, UserResponseModel } from '../app/admin/controllers'

// @ts-ignore
let sequelize: Sequelize = undefined

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
  await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
})

afterEach(async () => {
  return sequelize.close()
})

describe('Credentials update endpoint', () => {
  it("should allow the modification of a user's credentials", async () => {
    const admin = await createAdmin()

    const user_res = await request(App).post(baseUrlUsers).set(createBearerHeader(admin.token)).send(users[0])
    expect(user_res.statusCode).toBe(201)
    const user_body: UserResponseModel = user_res.body

    const update_res = await request(App)
      .post(baseUrlCredentials)
      .set(createBearerHeader(admin.token))
      .send({ id: user_body.credentials.id, email: users[1].email, password: users[1].password })

    expect(update_res.statusCode).toBe(204)

    const credentials = (await CredentialsService.getCredentialFromId(user_body.credentials.id))._unsafeUnwrap()

    expect(credentials.email).toBe(users[1].email)
    expect(credentials.password).toBe(EncryptionService.encrypt(users[1].password))
  })
})
