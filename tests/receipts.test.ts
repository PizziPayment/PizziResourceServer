import { App } from '../app/api'
import { config } from '../app/common/config'
import { ClientsService, CredentialsService, EncryptionService, rewriteTables, TokensService } from 'pizzi-db'
import * as request from 'supertest'

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}

const user = {
  name: 'toto',
  surname: 'tutu',
  email: 'toto@tutu.tata',
  password: 'gY@3Cwl4FmLlQ@HycAf',
  place: {
    address: '13 rue de la ville',
    city: 'Ville',
    zipcode: 25619,
  },
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

  await rewriteTables(orm_config)
  await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
})

async function setupUser(): Promise<string> {
  const res = await request(App).post('/users').set(client_header).send(user)

  expect(res.statusCode).toEqual(201)

  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = (await CredentialsService.getCredentialFromMailAndPassword(user.email, EncryptionService.encrypt(user.password)))._unsafeUnwrap()
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

  return token.access_token
}

function createBearerHeader(token: string): Object {
  return { Authorization: `Bearer ${token}` }
}

describe('Receipts endpoint', () => {
  const endpoint = '/receipts'

  describe('List request', () => {
    it('basic test', async () => {
      const token = await setupUser()
      const res = await request(App).get(endpoint).set(createBearerHeader(token)).send()

      expect(res.statusCode).toEqual(200)
    })
  })
})
