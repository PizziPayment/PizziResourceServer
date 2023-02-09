import { ClientsService, CredentialModel, CredentialsService, EncryptionService, rewriteTables, UserModel, UsersServices } from 'pizzi-db'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { App } from '../app/api'
import { baseUrlUsers } from '../app/admin/routes.config'
import { client, users } from './common/models'
import { createAdmin, createBearerHeader } from './common/services'
import { ClientResponseModel, UserResponseModel } from '../app/admin/controllers'
import { ResultAsync } from 'neverthrow'

// @ts-ignore
let sequelize: Sequelize = undefined

function models_to_user_response(user_model: UserModel, credentials: CredentialModel): UserResponseModel {
  return {
    id: user_model.id,
    firstname: user_model.firstname,
    surname: user_model.surname,
    address: user_model.address,
    zipcode: user_model.zipcode,
    credentials: {
      id: credentials.id,
      email: credentials.email,
    },
  }
}

async function createUsers(): Promise<UserResponseModel[]> {
  const maybe_users = await ResultAsync.combine(
    users.map((user) => {
      return UsersServices.createUser(user.name, user.surname, `${user.place.address} ${user.place.city}`, user.place.zipcode).andThen((user_model) => {
        return CredentialsService.createCredentialWithId('user', user_model.id, user.email, EncryptionService.encrypt(user.password)).map((credentials) =>
          models_to_user_response(user_model, credentials),
        )
      })
    }),
  )

  expect(maybe_users.isOk()).toBeTruthy()

  return maybe_users._unsafeUnwrap() as UserResponseModel[]
}

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

describe('User list endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const users_res = await createUsers()

    const res = await request(App).get(baseUrlUsers).set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body

    users_res.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(users_res))
  })

  it('with pagination', async () => {
    const admin = await createAdmin()
    const users_res = await createUsers()

    const endpoint = `${baseUrlUsers}?items_nb=1&page_nb=`
    const res = await request(App)
      .get(endpoint + '1')
      .set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(1)
    const body: ClientResponseModel[] = res.body

    const second_res = await request(App)
      .get(endpoint + '2')
      .set(createBearerHeader(admin.token))
    expect(second_res.statusCode).toBe(200)
    expect(second_res.body.length).toBe(1)
    body.push(second_res.body[0])

    users_res.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(users_res))
  })
})

describe('User creation endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const expected: UserResponseModel[] = []

    for (const user of users) {
      const res = await request(App).post(baseUrlUsers).set(createBearerHeader(admin.token)).send(user)

      expect(res.statusCode).toBe(201)
      expected.push(res.body)
    }

    const res = await request(App).get(baseUrlUsers).set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body

    expected.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(expected))
  })

  it('should check for duplicate user email', async () => {
    const admin = await createAdmin()

    const res = await request(App).post(baseUrlUsers).set(createBearerHeader(admin.token)).send(users[0])
    expect(res.statusCode).toBe(201)

    const dup_res = await request(App).post(baseUrlUsers).set(createBearerHeader(admin.token)).send(users[0])
    expect(dup_res.statusCode).toBe(400)
  })
})

describe('Users deletion endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()

    const res = await request(App).post(baseUrlUsers).set(createBearerHeader(admin.token)).send(users[0])
    expect(res.statusCode).toBe(201)

    const del_res = await request(App).post(`${baseUrlUsers}/${res.body.id}`).set(createBearerHeader(admin.token)).send()

    expect(del_res.statusCode).toBe(204)

    const list_res = await request(App).get(baseUrlUsers).set(createBearerHeader(admin.token)).send()
    expect(list_res.statusCode).toBe(200)
    expect(list_res.body.length).toBe(0)
  })

  it('returns an error if the user id is invalid', async () => {
    const admin = await createAdmin()

    const del_res = await request(App).post(`${baseUrlUsers}/897`).set(createBearerHeader(admin.token)).send()
    expect(del_res.statusCode).toBe(404)
  })
})
