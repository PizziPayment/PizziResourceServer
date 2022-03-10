import * as request from 'supertest'

import { App } from '../app/api'
import { baseUrl as endpoint } from '../app/shop_item/routes.config'
import { config } from '../app/common/config'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import { ClientsService, rewriteTables, ShopItemsService, ShopItemModel } from 'pizzi-db'
import { client, shop } from './common/models'
import { createBearerHeader, createRandomToken, createShop, getShopToken } from './common/services'
import { ShopItemCreationRequestModel } from '../app/shop_item/models/create.request.model'
import { ShopItemResponseModel, ShopItemsResponseModel } from '../app/shop_item/models/response.model'
import { intoDBOrder, intoDBSortBy, Order, SortBy } from '../app/shop_item/models/retrieve.request.model'

const shop_items: ShopItemCreationRequestModel = {
  items: [
    {
      name: 'cultivator',
      price: '346.00',
    },
    {
      name: 'red wheelbarrow',
      price: '100.00',
    },
  ],
}

const shop_items_missing_price = {
  items: [
    {
      name: 'cultivator',
      price: '346.00',
    },
    {
      name: 'red wheelbarrow',
    },
  ],
}

const shop_items_missing_name = {
  items: [
    {
      name: 'cultivator',
      price: '346.00',
    },
    {
      price: '99.99',
    },
  ],
}

async function retrieveAllShopItems(shop_id: number): Promise<Array<ShopItemModel>> {
  return (await ShopItemsService.retrieveShopItemPage(shop_id, 1, 9999, intoDBSortBy(SortBy.NAME), intoDBOrder(Order.ASC)))._unsafeUnwrap()
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

describe('Shop item endpoint', () => {
  describe('POST request', () => {
    it('should allow the creation of valid shop items', async () => {
      const shop_id = (await createShop()).id
      const token = await getShopToken(shop.email, shop.password)
      const res = await request(App).post(endpoint).set(createBearerHeader(token.access_token)).send(shop_items)

      expect(res.statusCode).toEqual(201)
      const created_items = (res.body as ShopItemsResponseModel).items
      const retrieved_items = await retrieveAllShopItems(shop_id)

      expect(created_items.length).toBe(shop_items.items.length)
      expect(retrieved_items.length).toBe(shop_items.items.length)

      for (let i = 0; i < shop_items.items.length; i++) {
        expect(created_items[i].name).toBe(shop_items.items[i].name)
        expect(created_items[i].price).toBe(shop_items.items[i].price)
        expect(retrieved_items[i].shop_id).toBe(shop_id)
        expect(retrieved_items[i].name).toBe(shop_items.items[i].name)
        expect(retrieved_items[i].price).toBe(shop_items.items[i].price)
      }
    })

    describe('should not allow the creation of shop items with a body', () => {
      const bodies = [
        ['without items', {}],
        ['without item in items', { items: [] }],
        ["with an items which isn't an array", { items: {} }],
        ['with an item without price', shop_items_missing_price],
        ['with an item without name', shop_items_missing_name],
      ]
      it.each(bodies)('%s: %o', async (_, body) => {
        const shop_id = (await createShop()).id
        const token = await getShopToken(shop.email, shop.password)
        const res = await request(App).post(endpoint).set(createBearerHeader(token.access_token)).send(body)

        expect(res.statusCode).toEqual(400)
        expect((await retrieveAllShopItems(shop_id)).length).toBe(0)
      })
    })
  })

  describe('GET request', () => {
    it('should not allow the retrieval of shop item with an invalid token', async () => {
      await createShop()
      const token = await getShopToken(shop.email, shop.password)
      const res = await request(App)
        .post(endpoint)
        .set(createBearerHeader(createRandomToken(token.access_token)))
        .send(shop_items)

      expect(res.statusCode).toBe(401)
    })

    describe('should retrieve items given a query', () => {
      const params = [
        [{ page: 1, nb_items: 3, sort_by: SortBy.NAME, order: Order.ASC, query: '', expected_si: shop_items.items }],
        [{ page: 2, nb_items: 1, sort_by: SortBy.NAME, order: Order.DESC, query: '', expected_si: [shop_items.items[0]] }],
        [{ page: 1, nb_items: 1, sort_by: SortBy.NAME, order: Order.ASC, query: '', expected_si: [shop_items.items[0]] }],
        [
          {
            page: 1,
            nb_items: 2,
            sort_by: SortBy.PRICE,
            order: Order.DESC,
            query: '',
            expected_si: shop_items.items,
          },
        ],
        [{ page: 1, nb_items: 2, sort_by: SortBy.NAME, order: Order.ASC, query: 'cul', expected_si: [shop_items.items[0]] }],
      ]

      it.each(params)('Test n%#', async (param) => {
        const { page, nb_items, sort_by, order, query, expected_si } = param

        await createShop()
        const token = await getShopToken(shop.email, shop.password)

        expect((await request(App).post(endpoint).set(createBearerHeader(token.access_token)).send(shop_items)).statusCode).toBe(201)

        const res = await request(App)
          .get(endpoint)
          .query({
            page,
            nb_items,
            sort_by: sort_by,
            order: order,
            query: query,
          })
          .set(createBearerHeader(token.access_token))
        expect(res.statusCode).toBe(200)
        const retrieved_items = (res.body as ShopItemsResponseModel).items
        expect(retrieved_items.length).toBe(expected_si.length)

        for (let i = 0; i < retrieved_items.length; i++) {
          expect(retrieved_items[i].name).toBe(expected_si[i].name)
          expect(retrieved_items[i].price).toBe(expected_si[i].price)
        }
      })
    })
  })
})
