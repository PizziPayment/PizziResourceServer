import { ClientModel, ClientsService, rewriteTables } from 'pizzi-db'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { App } from '../app/api'
import { baseUrlClients } from '../app/admin/routes.config'
import { admin, client } from './common/models'
import { createAdmin, createBearerHeader, getAdminToken } from './common/services'
import { ClientResponseModel } from '../app/admin/controllers'

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

describe('Client list endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const data: [string, string][] = [
      ['one_id', 'one_secret'],
      ['two_id', 'two_secret'],
    ]
    const clients: ClientModel[] = [(await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()]

    for (const [id, secret] of data) {
      clients.push((await ClientsService.createClientFromIdAndSecret(id, secret))._unsafeUnwrap())
    }
    clients.sort((lhs, rhs) => lhs.id - rhs.id)

    const res = await request(App).get(baseUrlClients).set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(clients))
  })

  it('with pagination', async () => {
    const admin = await createAdmin()
    const data: [string, string][] = [
      ['one_id', 'one_secret'],
      ['two_id', 'two_secret'],
    ]
    const clients: ClientModel[] = [(await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()]

    for (const [id, secret] of data) {
      clients.push((await ClientsService.createClientFromIdAndSecret(id, secret))._unsafeUnwrap())
    }
    clients.sort((lhs, rhs) => lhs.id - rhs.id)

    const endpoint = `${baseUrlClients}?items_nb=2&page_nb=`
    const res = await request(App)
      .get(endpoint + '1')
      .set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(2)
    const body: ClientResponseModel[] = res.body

    const second_res = await request(App)
      .get(endpoint + '2')
      .set(createBearerHeader(admin.token))
    expect(second_res.statusCode).toBe(200)
    expect(second_res.body.length).toBe(1)
    body.push(second_res.body[0])

    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(clients))
  })
})

describe('Client creation endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const data: string[] = ['one_id', 'two_id']
    const clients: ClientModel[] = [(await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()]

    for (const id of data) {
      const res = await request(App).post(baseUrlClients).set(createBearerHeader(admin.token)).send({ client_id: id })

      expect(res.statusCode).toBe(201)

      clients.push({ id: res.body.id, client_id: res.body.client_id, client_secret: res.body.client_secret })
    }
    clients.sort((lhs, rhs) => lhs.id - rhs.id)

    const res = await request(App).get(baseUrlClients).set(createBearerHeader(admin.token)).send()
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(clients))
  })

  it('should check for duplicate client id', async () => {
    const admin = await createAdmin()

    const res = await request(App).post(baseUrlClients).set(createBearerHeader(admin.token)).send({ client_id: 'CliendId' })
    expect(res.statusCode).toBe(201)

    const dup_res = await request(App).post(baseUrlClients).set(createBearerHeader(admin.token)).send({ client_id: 'CliendId' })
    expect(dup_res.statusCode).toBe(400)
  })
})

describe('Client deletion endpoint', () => {
  it('basic test', async () => {
    const admin_info = await createAdmin()
    const data: string[] = ['one_id', 'two_id']
    const clients: ClientModel[] = []
    const base_client = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()

    for (const id of data) {
      const res = await request(App).post(baseUrlClients).set(createBearerHeader(admin_info.token)).send({ client_id: id })

      expect(res.statusCode).toBe(201)

      clients.push({ id: res.body.id, client_id: res.body.client_id, client_secret: res.body.client_secret })
    }
    clients.sort((lhs, rhs) => lhs.id - rhs.id)

    const delete_res = await request(App).post(`${baseUrlClients}/${base_client.id}`).set(createBearerHeader(admin_info.token)).send()

    expect(delete_res.statusCode).toBe(204)

    const new_token = await getAdminToken(admin.email, admin.password, clients[0].id)

    const res = await request(App).get(baseUrlClients).set(createBearerHeader(new_token.access_token)).send()
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(clients))
  })

  it('should revoke the access tokens linked to a deleted client', async () => {
    const admin_info = await createAdmin()
    const base_client = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()

    const res = await request(App).post(`${baseUrlClients}/${base_client.id}`).set(createBearerHeader(admin_info.token)).send()

    expect(res.statusCode).toBe(204)

    const denied_res = await request(App).get(baseUrlClients).set(createBearerHeader(admin_info.token)).send()

    expect(denied_res.statusCode).toBe(401)
  })
})
