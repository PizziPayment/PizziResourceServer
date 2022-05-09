import { App } from '../app/api'
import { baseUrl as endpoint, baseUrlPassword as endpoint_password, baseUrlEmail as endpoint_email } from '../app/user/routes.config'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { rewriteTables, TokensServiceError, UsersServices, CredentialsService, EncryptionService, ClientsService, TokensService } from 'pizzi-db'
import { user, client, client_header } from './common/models'
import { getUser, getUserToken, createRandomToken, createBearerHeader } from './common/services'

async function createUser(): Promise<void> {
  const address = `${user.place.address} ${user.place.city}`
  const user_handle = (await UsersServices.createUser(user.name, user.surname, address, user.place.zipcode))._unsafeUnwrap()
  expect((await CredentialsService.createCredentialWithId('user', user_handle.id, user.email, EncryptionService.encrypt(user.password))).isOk()).toBeTruthy()
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

describe('User endpoint', () => {
  describe('GET request', () => {
    it("should return a user's information", async () => {
      await createUser()
      const token = await getUserToken(user.email, user.password)
      const address = `${user.place.address} ${user.place.city}`
      const res = await request(App).get(endpoint).set(createBearerHeader(token.access_token)).send()

      expect(res.statusCode).toEqual(200)
      expect(typeof res.body.id).toEqual('number')
      expect(res.body.firstname).toEqual(user.name)
      expect(res.body.surname).toEqual(user.surname)
      expect(res.body.address).toEqual(address)
      expect(res.body.zipcode).toEqual(user.place.zipcode)
    })

    it('should not accept an invalid token', async () => {
      await createUser()
      const token = await getUserToken(user.email, user.password)
      const invalid = createRandomToken(token.access_token)
      const res = await request(App).get(endpoint).set(createBearerHeader(invalid)).send()

      expect(res.statusCode).toEqual(401)
    })
  })

  describe('POST request', () => {
    it('should allow the creation of a valid user', async () => {
      const res = await request(App).post(endpoint).set(client_header).send(user)

      expect(res.statusCode).toEqual(201)
    })

    it('should not allow the creation of multiple users with the same email', async () => {
      const first_res = await request(App).post(endpoint).set(client_header).send(user)
      const second_res = await request(App)
        .post(endpoint)
        .set(client_header)
        .send({
          name: 'titi',
          surname: 'toto',
          email: user.email,
          password: 'gY@3Cwl4FmLlQ@HycAf',
          place: {
            address: 'Somewhere',
            city: 'Over the rainbow',
            zipcode: '12345',
          },
        })

      expect(first_res.statusCode).toEqual(201)
      expect(second_res.statusCode).toEqual(400)
    })

    describe('should not allow the creation of a user with a password which has', () => {
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
            ...user,
            password,
          })

        expect(res.statusCode).toEqual(400)
      })
    })
  })

  describe('DELETE request', () => {
    it('should allow the deletion of a user using a valid password and token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({ password: user.password })

      expect(res.statusCode).toEqual(204)
    })

    it('should not allow the deletion of a user using an invalid token', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const token = (await getUserToken(user.email, user.password)).access_token
      const header = createBearerHeader(createRandomToken(token))
      const res = await request(App).delete(endpoint).set(header).send({ password: user.password })

      expect(res.statusCode).toEqual(401)
    })

    it('should not allow the deletion of a user using an invalid password', async () => {
      const invalid_password = 'non3Cwl4FmLlQ@HycAf'
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({ password: invalid_password })

      expect(res.statusCode).toEqual(403)
    })

    it('should not allow the deletion of a user without a password', async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const res = await request(App).delete(endpoint).set(header).send({})

      expect(res.statusCode).toEqual(400)
    })
  })

  describe('PATCH request', () => {
    it("should allow the modification of a user's name", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)
      let user_data = await getUser(user.email, user.password)
      expect(user_data.firstname).toEqual(user.name)

      const name = 'woop'
      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const patch_res = await request(App).patch(endpoint).set(header).send({ name })

      expect(patch_res.statusCode).toEqual(200)
      user_data = await getUser(user.email, user.password)
      expect(user_data.firstname).toEqual(name)
    })

    it("should allow the modification of a user's surname", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)
      let user_data = await getUser(user.email, user.password)
      expect(user_data.surname).toEqual(user.surname)

      const surname = 'woop'
      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const patch_res = await request(App).patch(endpoint).set(header).send({ surname })

      expect(patch_res.statusCode).toEqual(200)
      user_data = await getUser(user.email, user.password)
      expect(user_data.surname).toEqual(surname)
    })

    it("should allow the modification of a user's address", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)
      let user_data = await getUser(user.email, user.password)
      expect(user_data.address).toEqual(`${user.place.address}, ${user.place.city}`)
      expect(user_data.zipcode).toEqual(user.place.zipcode)

      const place = {
        address: '14 rue de la paville',
        city: 'Paville',
        zipcode: 25620,
      }
      const header = createBearerHeader((await getUserToken(user.email, user.password)).access_token)
      const patch_res = await request(App).patch(endpoint).set(header).send({ place })

      expect(patch_res.statusCode).toEqual(200)
      user_data = await getUser(user.email, user.password)
      expect(user_data.address).toEqual(`${place.address}, ${place.city}`)
      expect(user_data.zipcode).toEqual(place.zipcode)
    })

    it("should not allow the modification of a user's informations with an invalid token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const name = 'woop'
      const token = (await getUserToken(user.email, user.password)).access_token
      const header = createBearerHeader(createRandomToken(token))
      const patch_res = await request(App).patch(endpoint).set(header).send({ name })

      expect(patch_res.statusCode).toEqual(401)
    })

    it("should not allow the modification of a user's informations without a token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const name = 'woop'
      const patch_res = await request(App).patch(endpoint).send({ name })

      expect(patch_res.statusCode).toEqual(400)
    })

    describe(endpoint_email, () => {
      const body = {
        password: user.password,
        new_email: 'f.n@example.com',
      }

      it("should allow the modification of a user's email", async () => {
        const create_res = await request(App).post(endpoint).set(client_header).send(user)

        expect(create_res.statusCode).toEqual(201)
        let token = await getUserToken(user.email, user.password)
        const header = createBearerHeader(token.access_token)

        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(204)

        TokensService.getTokenFromId(token.id)
        await getUserToken(body.new_email, user.password)
      })

      it("should not allow the modification of a user's email with an invalid token", async () => {
        const create_res = await request(App).post(endpoint).set(client_header).send(user)

        expect(create_res.statusCode).toEqual(201)
        let token = createRandomToken((await getUserToken(user.email, user.password)).access_token)
        const header = createBearerHeader(token)

        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(401)
      })

      it("should not allow the modification of a user's email with an invalid password", async () => {
        const create_res = await request(App).post(endpoint).set(client_header).send(user)

        expect(create_res.statusCode).toEqual(201)
        let token = (await getUserToken(user.email, user.password)).access_token
        const header = createBearerHeader(token)

        body.password = '!nvalid_Passw0rd'
        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(403)
      })

      it("should not allow the modification of a user's email with an invalid new email", async () => {
        const create_res = await request(App).post(endpoint).set(client_header).send(user)

        expect(create_res.statusCode).toEqual(201)
        let token = (await getUserToken(user.email, user.password)).access_token
        const header = createBearerHeader(token)

        body.new_email = 'invalid.emaile@'
        const patch_res = await request(App).patch(endpoint_email).set(header).send(body)

        expect(patch_res.statusCode).toEqual(400)
      })
    })
  })

  describe('PUT request', () => {
    it("should allow the modification of a user's password and revoke token with a valid token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: user.password,
        new_password: 'New_passw0rd!',
      }

      let token = (await getUserToken(user.email, user.password)).access_token
      const header = createBearerHeader(token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(204)

      let not_revoked_token = await TokensService.getTokenFromValue(token)
      expect(not_revoked_token.isErr()).toBe(true)
      expect(not_revoked_token._unsafeUnwrapErr()).toEqual(TokensServiceError.TokenNotFound)

      await getUserToken(user.email, body.new_password)
    })

    it("should not allow to modification of a user's password with an invalid token", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: user.password,
        new_password: 'New_passw0rd!',
      }

      const token = (await getUserToken(user.email, user.password)).access_token
      const header = createBearerHeader(createRandomToken(token))

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(401)
    })

    it("should not allow to modification of a user's password with an invalid password", async () => {
      const create_res = await request(App).post(endpoint).set(client_header).send(user)

      expect(create_res.statusCode).toEqual(201)

      const body = {
        password: '!nvalid Passw0rd',
        new_password: 'New_passw0rd!',
      }

      const token = (await getUserToken(user.email, user.password)).access_token
      const header = createBearerHeader(token)

      const put_res = await request(App).put(endpoint_password).set(header).send(body)
      expect(put_res.statusCode).toEqual(403)
    })
  })
})
