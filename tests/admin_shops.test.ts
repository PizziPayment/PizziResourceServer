import { ClientsService, CredentialModel, CredentialsService, EncryptionService, rewriteTables, ShopModel, ShopsServices } from 'pizzi-db'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { App } from '../app/api'
import { baseUrlShops } from '../app/admin/routes.config'
import { client, shops } from './common/models'
import { createAdmin, createBearerHeader } from './common/services'
import { ClientResponseModel, ShopResponseModel } from '../app/admin/controllers'
import { ResultAsync } from 'neverthrow'

// @ts-ignore
let sequelize: Sequelize = undefined

function models_to_shop_response(shop_model: ShopModel, credentials: CredentialModel): ShopResponseModel {
  return {
    id: shop_model.id,
    name: shop_model.name,
    phone: shop_model.phone,
    description: shop_model.description,
    siret: shop_model.siret,
    address: shop_model.address,
    city: shop_model.city,
    zipcode: shop_model.zipcode,
    avatar_id: shop_model.avatar_id,
    website: shop_model.website,
    instagram: shop_model.instagram,
    twitter: shop_model.twitter,
    facebook: shop_model.facebook,
    credentials: {
      id: credentials.id,
      email: credentials.email,
    },
  }
}

async function createShops(): Promise<ShopResponseModel[]> {
  const maybe_shops = await ResultAsync.combine(
    shops.map((shop) => {
      return ShopsServices.createShop(shop.name, shop.phone, Number(shop.siret), shop.place.address, shop.place.city, shop.place.zipcode).andThen(
        (shop_model) => {
          return CredentialsService.createCredentialWithId('shop', shop_model.id, shop.email, EncryptionService.encrypt(shop.password)).map((credentials) =>
            models_to_shop_response(shop_model, credentials),
          )
        },
      )
    }),
  )

  expect(maybe_shops.isOk()).toBeTruthy()

  return maybe_shops._unsafeUnwrap() as ShopResponseModel[]
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

describe('Shop list endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const shops_res = await createShops()

    const res = await request(App).get(baseUrlShops).set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body

    shops_res.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(shops_res))
  })

  it('with pagination', async () => {
    const admin = await createAdmin()
    const shops_res = await createShops()

    const endpoint = `${baseUrlShops}?items_nb=1&page_nb=`
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

    shops_res.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(shops_res))
  })
})

describe('Shop creation endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()
    const expected: ShopResponseModel[] = []

    for (const shop of shops) {
      const res = await request(App).post(baseUrlShops).set(createBearerHeader(admin.token)).send(shop)

      expect(res.statusCode).toBe(201)
      expected.push(res.body)
    }

    const res = await request(App).get(baseUrlShops).set(createBearerHeader(admin.token))
    expect(res.statusCode).toBe(200)
    const body: ClientResponseModel[] = res.body

    expected.sort((lhs, rhs) => lhs.id - rhs.id)
    body.sort((lhs, rhs) => lhs.id - rhs.id)

    expect(JSON.stringify(body)).toBe(JSON.stringify(expected))
  })

  it('should check for duplicate shop email', async () => {
    const admin = await createAdmin()

    const res = await request(App).post(baseUrlShops).set(createBearerHeader(admin.token)).send(shops[0])
    expect(res.statusCode).toBe(201)

    const dup_res = await request(App).post(baseUrlShops).set(createBearerHeader(admin.token)).send(shops[0])
    expect(dup_res.statusCode).toBe(400)
  })
})

describe('Shops deletion endpoint', () => {
  it('basic test', async () => {
    const admin = await createAdmin()

    const res = await request(App).post(baseUrlShops).set(createBearerHeader(admin.token)).send(shops[0])
    expect(res.statusCode).toBe(201)

    const del_res = await request(App).post(`${baseUrlShops}/${res.body.id}`).set(createBearerHeader(admin.token)).send()

    expect(del_res.statusCode).toBe(204)

    const list_res = await request(App).get(baseUrlShops).set(createBearerHeader(admin.token)).send()
    expect(list_res.statusCode).toBe(200)
    expect(list_res.body.length).toBe(0)
  })

  it('returns an error if the shop id is invalid', async () => {
    const admin = await createAdmin()

    const del_res = await request(App).post(`${baseUrlShops}/897`).set(createBearerHeader(admin.token)).send()
    expect(del_res.statusCode).toBe(404)
  })
})
