import * as request from 'supertest'

import { App } from '../app/api'
import { config } from '../app/common/config'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import { ClientsService, CredentialsService, EncryptionService, rewriteTables, TokensService } from 'pizzi-db'

const shop = {
  name: 'toto',
  surname: 'tutu',
  email: 'toto@tutu.tata',
  password: 'gY@3Cwl4FmLlQ@HycAf',
  phone: '0652076382', // Not in the documentation yet
  place: {
    address: '13 rue de la ville',
    city: 'Ville',
    zipcode: '25619',
  },
}

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}

async function getShopToken(email: string, password: string): Promise<string> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = (await CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

  return token.access_token
}

function randomString(length: number): string {
  let ret = ''

  while (ret.length < length) {
    ret += Math.random()
      .toString(16)
      .substr(0, length - ret.length)
  }

  return ret
}

function createRandomToken(token: string): string {
  let ret = token

  while (ret == token) {
    ret = randomString(token.length)
  }

  return ret
}

function createBearerHeader(token: string): Object {
  return { Authorization: `Bearer ${token}` }
}

beforeEach(async () => {
  const database = config.database
  const orm_config: OrmConfig = {
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

describe('Shop endpoint', () => {
  const endpoint = '/shops'

  describe('POST request', () => {
    it('should allow the creation of a valid shop', async () => {
      const res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(res.statusCode).toEqual(201)
    })

    it('should not allow the creation of multiple shops with the same email', async () => {
      const first_res = await request(App).post(endpoint).set(client_header).send(shop)
      const second_res = await request(App)
        .post(endpoint)
        .set(client_header)
        .send({
          ...shop,
          name: 'titi',
          surname: 'toto',
        })

      expect(first_res.statusCode).toEqual(201)
      expect(second_res.statusCode).toEqual(400)
    })

    describe('should not allow the creation of a shop with an invalid password', () => {
      it('shorter than 12 characters', async () => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password: '@bcd3',
          })

        expect(res.statusCode).toEqual(400)
      })

      it('no special character', async () => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password: 'Abcd3fgh1jklmnOp',
          })

        expect(res.statusCode).toEqual(400)
      })

      it('no number', async () => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password: '@bcdEfghIjklmnOp',
          })

        expect(res.statusCode).toEqual(400)
      })

      it('no uppercase character', async () => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password: '@bcd3fgh1jklmnop',
          })

        expect(res.statusCode).toEqual(400)
      })

      it('no lowercase character', async () => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password: '@BCD3FGH1JKLMNOP',
          })

        expect(res.statusCode).toEqual(400)
      })
    })
  })

  describe('DELETE request', () => {
    it('should allow the deletion of a shop using a valid password and token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader(await getShopToken(shop.email, shop.password))
      const res = await request(App).delete(endpoint).set(header).send({ password: shop.password })

      expect(res.statusCode).toEqual(204)
    })

    it('should not allow the deletion of a shop using an invalid token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const token = await getShopToken(shop.email, shop.password)
      const header = createBearerHeader(createRandomToken(token))
      const res = await request(App).delete(endpoint).set(header).send({ password: shop.password })

      expect(res.statusCode).toEqual(401)
    })

    it('should not allow the deletion of a shop using an invalid password', async () => {
      const invalid_password = 'non3Cwl4FmLlQ@HycAf'
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader(await getShopToken(shop.email, shop.password))
      const res = await request(App).delete(endpoint).set(header).send({ password: invalid_password })

      expect(res.statusCode).toEqual(403)
    })

    it('should not allow the deletion of a shop without a password', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader(await getShopToken(shop.email, shop.password))
      const res = await request(App).delete(endpoint).set(header).send({})

      expect(res.statusCode).toEqual(400)
    })
  })
})
