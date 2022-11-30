import { ClientsService, rewriteTables } from 'pizzi-db'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { App } from '../app/api'
import { baseUrlAdmins } from '../app/admin/routes.config'
import { client } from './common/models'
import { createAdmin, createBearerHeader, getAdminToken } from './common/services'
import { AdminResponseModel } from '../app/admin/controllers'

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

describe('Admin list endpoint', () => {
  it('basic test', async () => {
    const emails: string[] = ['toto@tata.com', 'tutu@tete.com']
    let token: string = ''
    const admins: AdminResponseModel[] = await Promise.all(
      emails.map(async (email) => {
        const details = await createAdmin(email, 'P@ssw0rdlong')
        token = details.token
        return { id: details.id, credentials_id: details.credentials_id, email }
      }),
    )
    admins.sort((lhs, rhs) => lhs.id - rhs.id)

    const res = await request(App).get(baseUrlAdmins).set(createBearerHeader(token))
    expect(res.statusCode).toBe(200)
    const body: AdminResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(admins))
  })

  it('with pagination', async () => {
    const emails: string[] = ['toto@tata.com', 'tutu@tete.com', 'third@stop.com']
    let token: string = ''
    const admins: AdminResponseModel[] = await Promise.all(
      emails.map(async (email) => {
        const details = await createAdmin(email, 'P@ssw0rdlong')
        token = details.token
        return { id: details.id, credentials_id: details.credentials_id, email }
      }),
    )
    admins.sort((lhs, rhs) => lhs.id - rhs.id)

    const endpoint = `${baseUrlAdmins}?items_nb=2&page_nb=`

    const res = await request(App)
      .get(endpoint + '1')
      .set(createBearerHeader(token))
    expect(res.statusCode).toBe(200)
    expect(res.body.length).toBe(2)
    let body: AdminResponseModel[] = res.body

    const second_res = await request(App)
      .get(endpoint + '2')
      .set(createBearerHeader(token))
    expect(second_res.statusCode).toBe(200)
    expect(second_res.body.length).toBe(1)
    body.push(second_res.body[0])

    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(admins))
  })
})

describe('Admin creation endpoint', () => {
  it('basic test', async () => {
    const base_email = 'basic@admin.com'
    const admin = await createAdmin(base_email)
    const emails: string[] = ['toto@tata.com', 'tutu@tete.com']
    const admins: AdminResponseModel[] = [{ id: admin.id, credentials_id: admin.credentials_id, email: base_email }]
    const password = 'P@ssw0rdlong'

    for (const email of emails) {
      const res = await request(App).post(baseUrlAdmins).set(createBearerHeader(admin.token)).send({ email, password })

      expect(res.statusCode).toBe(201)
      admins.push(res.body)
    }
    admins.sort((lhs, rhs) => lhs.id - rhs.id)

    const res = await request(App).get(baseUrlAdmins).set(createBearerHeader(admin.token)).send()
    expect(res.statusCode).toBe(200)
    const body: AdminResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(admins))
  })

  it('should check for duplicate admin email', async () => {
    const admin = await createAdmin()
    const password = 'P@ssw0rdlong'

    const res = await request(App).post(baseUrlAdmins).set(createBearerHeader(admin.token)).send({ email: 'toto@tata.com', password })
    expect(res.statusCode).toBe(201)

    const dup_res = await request(App).post(baseUrlAdmins).set(createBearerHeader(admin.token)).send({ email: 'toto@tata.com', password })
    expect(dup_res.statusCode).toBe(400)
  })
})

describe('Admin deletion endpoint', () => {
  it('basic test', async () => {
    const admin_info = await createAdmin()
    const emails: string[] = ['toto@tata.com', 'tutu@tete.com']
    const admins: AdminResponseModel[] = []
    const base_client = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
    const password = 'P@ssw0rdlong'

    for (const email of emails) {
      const res = await request(App).post(baseUrlAdmins).set(createBearerHeader(admin_info.token)).send({ email, password })

      expect(res.statusCode).toBe(201)

      admins.push(res.body)
    }
    admins.sort((lhs, rhs) => lhs.id - rhs.id)

    const delete_res = await request(App).post(`${baseUrlAdmins}/${admin_info.id}`).set(createBearerHeader(admin_info.token)).send()

    expect(delete_res.statusCode).toBe(204)

    const new_token = await getAdminToken(admins[0].email, password, base_client.id)

    const res = await request(App).get(baseUrlAdmins).set(createBearerHeader(new_token.access_token)).send()
    expect(res.statusCode).toBe(200)
    const body: AdminResponseModel[] = res.body
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(admins))
  })

  it('should revoke the access tokens linked to a deleted admin', async () => {
    const admin_info = await createAdmin()
    const res = await request(App).post(`${baseUrlAdmins}/${admin_info.id}`).set(createBearerHeader(admin_info.token)).send()

    expect(res.statusCode).toBe(204)

    const denied_res = await request(App).get(baseUrlAdmins).set(createBearerHeader(admin_info.token)).send()

    expect(denied_res.statusCode).toBe(401)
  })
})
