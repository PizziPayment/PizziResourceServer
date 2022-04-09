import * as request from 'supertest'

import { App } from '../app/api'
import { baseUrl as endpoint } from '../app/shop_item/routes.config'
import { config } from '../app/common/config'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import { ClientsService, rewriteTables, ShopItemsService, ShopItemModel } from 'pizzi-db'
import { client, shops } from './common/models'
import { createBearerHeader, createRandomToken, createShop, getShopToken, createBearerHeaderFromCredential } from './common/services'
import { ShopItemCreationRequestModel } from '../app/shop_item/models/create.request.model'
import { ShopItemResponseModel, ShopItemsResponseModel } from '../app/shop_item/models/response.model'
import { intoDBOrder, intoDBSortBy, Order, SortBy } from '../app/shop_item/models/retrieve.request.model'
import { ShopItemUpdateRequestModel } from '../app/shop_item/models/update.request.model'

const shop = shops[0]
const shop_items: ShopItemCreationRequestModel = {
  items: [
    {
      name: 'cultivator',
      price: '346',
    },
    {
      name: 'red wheelbarrow',
      price: '99.99',
    },
  ],
}

const shop_items_missing_price = {
  items: [
    {
      name: 'cultivator',
      price: '346',
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
      price: '346',
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
        expect(parseFloat(created_items[i].price)).toBe(parseFloat(shop_items.items[i].price))
        expect(retrieved_items[i].shop_id).toBe(shop_id)
        expect(retrieved_items[i].name).toBe(shop_items.items[i].name)
        expect(parseFloat(retrieved_items[i].price)).toBe(parseFloat(shop_items.items[i].price))
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
          expect(parseFloat(retrieved_items[i].price)).toBe(parseFloat(expected_si[i].price))
        }
      })
    })
  })

  describe('PATCH request', () => {
    describe('should allow the modification of a shop item', () => {
      const new_items_properties: Array<Array<ShopItemUpdateRequestModel>> = [
        [
          {
            name: 'pickaxe',
            price: undefined,
          },
        ],
        [{ name: undefined, price: '4500' }],
        [{ name: 'hoe', price: '4599' }],
        [{ name: 'Manual Edge Trimmer', price: '4599' }],
        [{ name: 'hoe', price: '34.5' }],
      ]

      it.each(new_items_properties)('Test n%#', async (new_item_properties) => {
        const shop_item_req: ShopItemCreationRequestModel = {
          items: [
            {
              name: 'Manual Edge Trimmer',
              price: '34.5',
            },
          ],
        }

        await createShop()
        const bearer_header = await createBearerHeaderFromCredential(shop.email, shop.password)

        const maybe_shop_item = await request(App).post(endpoint).set(bearer_header).send(shop_item_req)
        expect(maybe_shop_item.statusCode).toBe(201)
        const shop_item = (maybe_shop_item.body as ShopItemsResponseModel).items[0]

        const res = await request(App)
          .patch(endpoint + `/${shop_item.id}`)
          .set(bearer_header)
          .send(new_item_properties)
        expect(res.statusCode).toBe(200)
        const new_shop_item = res.body as ShopItemResponseModel

        expect(shop_item.id).not.toBe(new_shop_item.id)

        if (new_item_properties.name !== undefined) {
          expect(new_shop_item.name).toBe(new_item_properties.name)
        } else {
          expect(new_shop_item.name).toBe(shop_item.name)
        }

        if (new_item_properties.price !== undefined) {
          expect(parseFloat(new_shop_item.price)).toBe(parseFloat(new_item_properties.price))
        } else {
          expect(parseFloat(new_shop_item.price)).toBe(parseFloat(shop_item.price))
        }
      })
    })

    describe('should not allow the modification of a shop item', () => {
      it('with an invalid token', async () => {
        await createShop()
        const new_item: ShopItemUpdateRequestModel = { name: 'Toto', price: '23.00' }

        const token = (await getShopToken(shop.email, shop.password)).access_token
        const header = createBearerHeader(token)

        const maybe_shop_item = await request(App).post(endpoint).set(header).send(shop_items)
        expect(maybe_shop_item.statusCode).toBe(201)
        const shop_item = (maybe_shop_item.body as ShopItemsResponseModel).items[0]

        const res = await request(App)
          .patch(endpoint + `/${shop_item.id}`)
          .set(createBearerHeader(createRandomToken(token)))
          .send(new_item)
        expect(res.statusCode).toBe(401)
      })

      it("that doesn't belong to the shop", async () => {
        await createShop()
        await createShop(shops[1])
        const new_item: ShopItemUpdateRequestModel = { name: 'Toto', price: '23.00' }

        const token = (await getShopToken(shop.email, shop.password)).access_token
        const header = createBearerHeader(token)

        const maybe_shop_item = await request(App).post(endpoint).set(header).send(shop_items)
        expect(maybe_shop_item.statusCode).toBe(201)
        const shop_item = (maybe_shop_item.body as ShopItemsResponseModel).items[0]

        const bearer_header = await createBearerHeaderFromCredential(shops[1].email, shops[1].password)
        const res = await request(App)
          .patch(endpoint + `/${shop_item.id}`)
          .set(bearer_header)
          .send(new_item)
        expect(res.statusCode).toBe(404)
      })

      it('with no property', async () => {
        await createShop()

        const token = (await getShopToken(shop.email, shop.password)).access_token
        const header = createBearerHeader(token)

        const maybe_shop_item = await request(App).post(endpoint).set(header).send(shop_items)
        expect(maybe_shop_item.statusCode).toBe(201)
        const shop_item = (maybe_shop_item.body as ShopItemsResponseModel).items[0]

        const bearer_header = await createBearerHeaderFromCredential(shop.email, shop.password)
        const res = await request(App)
          .patch(endpoint + `/${shop_item.id}`)
          .set(bearer_header)
          .send({})
        expect(res.statusCode).toBe(400)
      })

      it('with the same properties', async () => {
        await createShop()

        const token = (await getShopToken(shop.email, shop.password)).access_token
        const header = createBearerHeader(token)

        const maybe_shop_item = await request(App).post(endpoint).set(header).send(shop_items)
        expect(maybe_shop_item.statusCode).toBe(201)
        const shop_item = (maybe_shop_item.body as ShopItemsResponseModel).items[0]

        const new_item: ShopItemUpdateRequestModel = { name: shop_item.name, price: shop_item.price }
        const res = await request(App)
          .patch(endpoint + `/${shop_item.id}`)
          .set(header)
          .send(new_item)
        expect(res.statusCode).toBe(400)
      })
    })
  })
})
