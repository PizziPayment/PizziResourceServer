import { App } from '../app/api'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { CredentialModel, rewriteTables, TokenModel, TokensServiceError, UserModel, UsersServices } from 'pizzi-db'
import { ClientsService } from 'pizzi-db'
import { CredentialsService } from 'pizzi-db'
import { TokensService } from 'pizzi-db'
import { EncryptionService } from 'pizzi-db'

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

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}

async function getUserCredentials(email: string, password: string): Promise<CredentialModel> {
  return (await CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
}

async function getUser(email: string, password: string): Promise<UserModel> {
  const credentials = await getUserCredentials(email, password)

  return (await UsersServices.getUserFromId(credentials.user_id))._unsafeUnwrap()
}

async function getUserToken(email: string, password: string): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = await getUserCredentials(email, password)
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

  return token
}

function randomString(length: number): string {
  let ret = ''

  while (ret.length < length) {
    ret += Math.random()
      .toString(16)
      .substring(0, length - ret.length)
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
  const endpoint = '/users'
  const endpoint_password = '/user/password'
  const endpoint_email = '/user/email'

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

    it("should not allow the modification of a user's informations with an invalid token", async () => {
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
