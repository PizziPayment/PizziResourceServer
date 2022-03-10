import * as request from 'supertest'

import { App } from '../app/api'
import { baseUrl as endpoint } from '../app/shop_item/routes.config'
import { config } from '../app/common/config'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'
import { ClientsService, rewriteTables, ShopItemsService, ShopItemModel, SortBy, Order } from 'pizzi-db'
import { client, shop } from './common/models'
import { createBearerHeader, createShop, getShopToken } from './common/services'
import { ShopItemCreationRequestModel } from '../app/shop_item/models/create.request.model'

const shop_items: ShopItemCreationRequestModel = {
  items: [
    {
      name: 'cultivator',
      price: 346,
    },
    {
      name: 'red wheelbarrow',
      price: 100,
    },
  ],
}

const shop_items_missing_price = {
  items: [
    {
      name: 'cultivator',
      price: 346,
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
      price: 346,
    },
    {
      price: 99.99,
    },
  ],
}

async function retrieveAllShopItems(shop_id: number): Promise<Array<ShopItemModel>> {
  return (await ShopItemsService.retrieveShopItemPage(shop_id, 1, 9999, '', SortBy.NAME, Order.DESC))._unsafeUnwrap()
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
      await createShop()
      const token = await getShopToken(shop.email, shop.password)
      const res = await request(App).post(endpoint).set(createBearerHeader(token.access_token)).send(shop_items)

      expect(res.statusCode).toEqual(201)
      const created_items = res.body.items

      for (let i = 0; i < shop_items.items.length; i++) {
        expect(created_items[i].name).toBe(shop_items.items[i].name)
        expect(created_items[i].price).toBe(shop_items.items[i].price)
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
})
