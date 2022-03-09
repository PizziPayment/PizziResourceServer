import * as request from 'supertest'

import { App } from '../app/api'
import { baseUrl as endpoint, baseUrlPassword as endpoint_password, baseUrlEmail as endpoint_email } from '../app/shop/routes.config'
import { config } from '../app/common/config'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import { ClientsService, CredentialsService, EncryptionService, rewriteTables, ShopsServices, TokenModel, TokensService, TokensServiceError } from 'pizzi-db'

const shop = {
  name: 'toto',
  surname: 'tutu',
  email: 'toto@tutu.tata',
  password: 'gY@3Cwl4FmLlQ@HycAf',
  phone: '0652076382', // Not in the documentation yet
  place: {
    address: '13 rue de la ville',
    city: 'Ville',
    zipcode: 25619,
  },
}

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}

async function createShop(): Promise<void> {
  const address = `${shop.place.address} ${shop.place.city}`
  const shop_handle = (await ShopsServices.createShop(shop.name, shop.phone, address, shop.place.zipcode))._unsafeUnwrap()
  expect((await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))).isOk()).toBeTruthy()
}

async function getShopToken(email: string, password: string): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = (await CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

  return token
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
  describe('GET request', () => {
    it("should return a shop's information", async () => {
      await createShop()
      const token = await getShopToken(shop.email, shop.password)
      const res = await request(App).get(endpoint).set(createBearerHeader(token.access_token)).send()

      expect(res.statusCode).toEqual(200)
    })

    it('should not accept an invalid token', async () => {
      await createShop()
      const token = await getShopToken(shop.email, shop.password)
      const invalid = createRandomToken(token.access_token)
      const res = await request(App).get(endpoint).set(createBearerHeader(invalid)).send()

      expect(res.statusCode).toEqual(401)
    })
  })

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

    describe('should not allow the creation of a shop with a password which has', () => {
      const passwords: Array<Array<String>> = [
        ['not at least 12 characters', '@Bcd3'],
        ['no special character', 'Abcd3fgh1jklmnOp'],
        ['no number', '@bcdEfghIjklmnOp'],
        ['no uppercase character', '@bcd3fgh1jklmnop'],
        ['no lowercase character', '@BCD3FGH1JKLMNOP'],
      ]

      it.each(passwords)('%s: %s', async (password) => {
        const res = await request(App)
          .post(endpoint)
          .set(client_header)
          .send({
            ...shop,
            password,
          })

        expect(res.statusCode).toEqual(400)
      })
    })
  })

  describe('DELETE request', () => {
    it('should allow the deletion of a shop using a valid password and token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getShopToken(shop.email, shop.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({ password: shop.password })

      expect(res.statusCode).toEqual(204)
    })

    it('should not allow the deletion of a shop using an invalid token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const token = (await getShopToken(shop.email, shop.password)).access_token
      const header = createBearerHeader(createRandomToken(token))
      const res = await request(App).delete(endpoint).set(header).send({ password: shop.password })

      expect(res.statusCode).toEqual(401)
    })

    it('should not allow the deletion of a shop using an invalid password', async () => {
      const invalid_password = 'non3Cwl4FmLlQ@HycAf'
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getShopToken(shop.email, shop.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({ password: invalid_password })

      expect(res.statusCode).toEqual(403)
    })

    it('should not allow the deletion of a shop without a password', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getShopToken(shop.email, shop.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({})

      expect(res.statusCode).toEqual(400)
    })
  })

  describe('PUT request', () => {
    it("should allow the modification of a shop's password and revoke token with a valid token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: shop.password,
        new_password: 'New_passw0rd!',
      }

      let token = (await getShopToken(shop.email, shop.password)).access_token
      const header = createBearerHeader(token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(204)

      let not_revoked_token = await TokensService.getTokenFromValue(token)
      expect(not_revoked_token.isErr()).toBe(true)
      expect(not_revoked_token._unsafeUnwrapErr()).toEqual(TokensServiceError.TokenNotFound)

      await getShopToken(shop.email, body.new_password)
    })

    it("should not allow to modification of a shop's password with an invalid token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: shop.password,
        new_password: 'New_passw0rd!',
      }

      const token = (await getShopToken(shop.email, shop.password)).access_token
      const header = createBearerHeader(createRandomToken(token))

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(401)
    })

    it("should not allow to modification of a shop's password with an invalid password", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(shop)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: '!nvalid Passw0rd',
        new_password: 'New_passw0rd!',
      }

      const token = (await getShopToken(shop.email, shop.password)).access_token
      const header = createBearerHeader(token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(403)
    })

    describe('PATCH request', () => {
      describe(endpoint_email, () => {
        const body = {
          password: shop.password,
          new_email: 'f.n@example.com',
        }

        it("should allow the modification of a user's email", async () => {
          const create_res = await request(App).post(endpoint).set(client_header).send(shop)

          expect(create_res.statusCode).toEqual(201)
          let token = await getShopToken(shop.email, shop.password)
          const header = createBearerHeader(token.access_token)

          const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

          expect(patch_res.statusCode).toEqual(204)

          TokensService.getTokenFromId(token.id)
          await getShopToken(body.new_email, shop.password)
        })

        it("should not allow the modification of a user's email with an invalid token", async () => {
          const create_res = await request(App).post(endpoint).set(client_header).send(shop)

          expect(create_res.statusCode).toEqual(201)
          let token = createRandomToken((await getShopToken(shop.email, shop.password)).access_token)
          const header = createBearerHeader(token)

          const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

          expect(patch_res.statusCode).toEqual(401)
        })

        it("should not allow the modification of a user's email with an invalid password", async () => {
          const create_res = await request(App).post(endpoint).set(client_header).send(shop)

          expect(create_res.statusCode).toEqual(201)
          let token = (await getShopToken(shop.email, shop.password)).access_token
          const header = createBearerHeader(token)

          body.password = '!nvalid_Passw0rd'
          const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

          expect(patch_res.statusCode).toEqual(403)
        })

        it("should not allow the modification of a user's email with an invalid new email", async () => {
          const create_res = await request(App).post(endpoint).set(client_header).send(shop)

          expect(create_res.statusCode).toEqual(201)
          let token = (await getShopToken(shop.email, shop.password)).access_token
          const header = createBearerHeader(token)

          body.new_email = 'invalid.emaile@'
          const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

          expect(patch_res.statusCode).toEqual(400)
        })
      })
    })
  })
})
