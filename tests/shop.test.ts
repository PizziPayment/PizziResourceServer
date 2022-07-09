import {
  ClientsService,
  CredentialsService,
  ErrorCause,
  rewriteTables,
  ShopModel,
  ShopsServices,
  TokenModel,
  TokensService,
} from 'pizzi-db'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import * as request from 'supertest'
import { App } from '../app/api'
import { config } from '../app/common/config'
import ChangeEmailValidationModel from '../app/common/models/email.request.model'
import RequestPasswordModel from '../app/common/models/password.request.model'
import InfosResponseModel from '../app/shop/models/infos.response.model'
import { PatchRequestModel } from '../app/shop/models/patch.request.model'
import RegisterRequestModel from '../app/shop/models/register.request.model'
import { baseUrl as endpoint, baseUrlEmail as endpoint_email, baseUrlPassword as endpoint_password } from '../app/shop/routes.config'
import { client, client_header, shops } from './common/models'
import { createBearerHeader, createRandomToken, createShop, getShopToken } from './common/services'

const shop = shops[0]

// @ts-ignore
let sequelize: Sequelize = undefined

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

  sequelize = await rewriteTables(orm_config)
  await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
})


afterEach(async () => await sequelize.close())

async function setupShopAndToken(shop: RegisterRequestModel = shops[0]): Promise<[ShopModel, TokenModel]> {
  return [await createShop(), await getShopToken(shop.email, shop.password)]
}

describe('Shop endpoint', () => {
  describe('GET request', () => {
    it("should return a shop's information", async () => {
      const [_, token] = await setupShopAndToken()
      const res = await request(App).get(endpoint).set(createBearerHeader(token.access_token)).send()

      expect(res.statusCode).toEqual(200)
      expect(res.body.email).toEqual(shop.email)
      expect(res.body.name).toEqual(shop.name)
      expect(res.body.phone).toEqual(shop.phone)
      expect(res.body.address).toEqual(shop.place.address)
      expect(res.body.city).toEqual(shop.place.city)
      expect(res.body.zipcode).toEqual(shop.place.zipcode)
      expect(res.body.siret).toEqual(shop.siret)
    })

    it('should not accept an invalid token', async () => {
      const [_, token] = await setupShopAndToken()
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

      it.each(passwords)('%s: %s', async (_, password) => {
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
      const [created_shop, token] = await setupShopAndToken()

      const header = createBearerHeader(token.access_token)

      expect((await request(App).delete(endpoint).set(header).send({ password: shop.password })).statusCode).toEqual(204)

      expect((await request(App).get(endpoint).set(header).send()).statusCode).toBe(401)
      const res = await ShopsServices.getShopFromId(created_shop.id)
      expect(res.isOk()).toBeTruthy()

      const res_cred = await CredentialsService.getCredentialFromId(token.credential_id)
      expect(res_cred.isErr()).toBeTruthy()
      expect(res_cred._unsafeUnwrapErr().code).toBe(ErrorCause.CredentialNotFound)
    })

    it('should not allow the deletion of a shop using an invalid token', async () => {
      const [_, token] = await setupShopAndToken()

      const header = createBearerHeader(createRandomToken(token.access_token))
      const res = await request(App).delete(endpoint).set(header).send({ password: shop.password })

      expect(res.statusCode).toEqual(401)
    })

    it('should not allow the deletion of a shop using an invalid password', async () => {
      const [_, token] = await setupShopAndToken()
      const invalid_password = 'non3Cwl4FmLlQ@HycAf'

      const header = createBearerHeader(token.access_token)
      const res = await request(App).delete(endpoint).set(header).send({ password: invalid_password })

      expect(res.statusCode).toEqual(403)
    })

    it('should not allow the deletion of a shop without a password', async () => {
      const [_, token] = await setupShopAndToken()

      const header = createBearerHeader(token.access_token)
      const res = await request(App).delete(endpoint).set(header).send({})

      expect(res.statusCode).toEqual(400)
    })
  })

  describe('PUT request', () => {
    it("should allow the modification of a shop's password and revoke token with a valid token", async () => {
      const [_, token] = await setupShopAndToken()

      const body: RequestPasswordModel = {
        password: shop.password,
        new_password: 'New_passw0rd!',
      }

      const header = createBearerHeader(token.access_token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(204)

      let revoked_token = await TokensService.getTokenFromAccessValue(token.access_token)
      expect(revoked_token.isErr()).toBe(true)
      expect(revoked_token._unsafeUnwrapErr().code).toEqual(ErrorCause.TokenNotFound)

      await getShopToken(shop.email, body.new_password)
    })

    it("should not allow to modification of a shop's password with an invalid token", async () => {
      const [_, token] = await setupShopAndToken()

      const body: RequestPasswordModel = {
        password: shop.password,
        new_password: 'New_passw0rd!',
      }

      const header = createBearerHeader(createRandomToken(token.access_token))

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(401)
    })

    it("should not allow to modification of a shop's password with an invalid password", async () => {
      const [_, token] = await setupShopAndToken()

      const body: RequestPasswordModel = {
        password: '!nvalid Passw0rd',
        new_password: 'New_passw0rd!',
      }

      const header = createBearerHeader(token.access_token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(403)
    })
  })

  describe('PATCH request', () => {
    describe(endpoint_email, () => {
      const body: ChangeEmailValidationModel = {
        password: shop.password,
        new_email: 'f.n@example.com',
      }

      it("should allow the modification of a shop's email", async () => {
        const [_, token] = await setupShopAndToken()

        const header = createBearerHeader(token.access_token)

        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(204)

        TokensService.getTokenFromId(token.id)
        await getShopToken(body.new_email, shop.password)
      })

      it("should not allow the modification of a shop's email with an invalid token", async () => {
        const [_, token] = await setupShopAndToken()

        const header = createBearerHeader(createRandomToken(token.access_token))

        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(401)
      })

      it("should not allow the modification of a shop's email with an invalid password", async () => {
        const [_, token] = await setupShopAndToken()

        const header = createBearerHeader(token.access_token)

        body.password = '!nvalid_Passw0rd'
        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(403)
      })

      it("should not allow the modification of a shop's email with an invalid new email", async () => {
        const [_, token] = await setupShopAndToken()

        const header = createBearerHeader(token.access_token)

        body.new_email = 'invalid.emaile@'
        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(400)
      })
    })

    describe(endpoint, () => {
      const body: PatchRequestModel = {
        description: 'Desc',
        website: 'https://example.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com/Twitter',
        facebook: 'https://facebook.com',
      }

      it("should allow the modification of a shop's informations", async () => {
        const [created_shop, token] = await setupShopAndToken()

        const header = createBearerHeader(token.access_token)

        const patch_res = await request(App).patch(endpoint).set(header).send(body)

        expect(patch_res.statusCode).toEqual(200)
        const response = patch_res.body as InfosResponseModel

        expect(response.description).toBe(body.description)
        expect(response.website).toBe(body.website)
        expect(response.instagram).toBe(body.instagram)
        expect(response.twitter).toBe(body.twitter)
        expect(response.facebook).toBe(body.facebook)

        const res = await ShopsServices.getShopFromId(created_shop.id)
        expect(res.isOk()).toBeTruthy()
        const modified_shop = res._unsafeUnwrap()

        expect(modified_shop.description).toBe(body.description)
        expect(modified_shop.website).toBe(body.website)
        expect(modified_shop.instagram).toBe(body.instagram)
        expect(modified_shop.twitter).toBe(body.twitter)
        expect(modified_shop.facebook).toBe(body.facebook)
      })

      describe("should not allow the modification of a shop's information", () => {
        it('with an invalid token', async () => {
          const [_, token] = await setupShopAndToken()

          const header = createBearerHeader(createRandomToken(token.access_token))

          expect((await request(App).patch(endpoint).set(header).send(body)).statusCode).toBe(401)
        })

        it('without a token', async () => {
          const [_, __] = await setupShopAndToken()

          expect((await request(App).patch(endpoint).send(body)).statusCode).toBe(400)
        })
      })
    })
  })
})
