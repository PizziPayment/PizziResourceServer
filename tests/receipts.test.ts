import { App } from '../app/api'
import { config } from '../app/common/config'
import {
  ClientsService,
  CredentialsService,
  EncryptionService,
  ReceiptItemsService,
  rewriteTables,
  ShopItemsService,
  ShopsServices,
  TokensService,
  TransactionsService,
  UsersServices,
  ReceiptsService,
} from 'pizzi-db'
import * as request from 'supertest'
import { users, shops, client } from './common/models'
import { ReceiptModel } from '../app/user/models/receipt_list.model'
import { DetailedReceiptModel } from '../app/user/models/detailed_receipt'
import CreateTransactionRequestModel from '../app/shop/models/create_transaction.request.model'

const shop = shops[0]

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

async function setupUser(id?: number): Promise<{ token: string; id: number }> {
  const user = users[id || 0]
  const user_handle_result = await UsersServices.createUser(user.name, user.surname, '', user.place.zipcode)
  expect(user_handle_result.isOk())
  const user_handle = user_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('user', user_handle.id, user.email, EncryptionService.encrypt(user.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle.id, credentials.id)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return { token: token.access_token, id: user_handle.id }
}

class Item {
  name: string
  price: string
  discount: number
  eco_tax: number
  quantity: number
  warranty: string
}

class CompleteItem extends Item {
  id: number
}

const items: Item[] = [
  { name: 'Outer Wilds', price: '17.49', discount: 0, eco_tax: 0, quantity: 1, warranty: 'none' },
  { name: 'Outer Wilds - Echoes of the Eye', price: '10.40', discount: 0, eco_tax: 0, quantity: 1, warranty: 'none' },
]
const total_price = Number(
  items
    .map((item) => Number(item.price))
    .reduce((lhs, rhs) => lhs + rhs)
    .toFixed(2),
)

async function setupShop(id?: number): Promise<{ id: number; items: Array<CompleteItem>; token: string }> {
  const shop = shops[id || 0]
  const shop_handle_result = await ShopsServices.createShop(shop.name, shop.phone, Number(shop.siret), shop.place.address, shop.place.city, shop.place.zipcode)
  expect(shop_handle_result.isOk()).toBeTruthy()
  const shop_handle = shop_handle_result._unsafeUnwrap()

  const items_total = []

  for (const item of items) {
    const item_handle_result = await ShopItemsService.createShopItem(shop_handle.id, item.name, item.price)
    expect(item_handle_result.isOk()).toBeTruthy()
    const item_handle = item_handle_result._unsafeUnwrap()

    items_total.push({ ...item, id: item_handle.id })
  }

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle.id, credentials.id)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return { id: shop_handle.id, items: items_total, token: token.access_token }
}

async function setupReceipts(user: number, shop: number, items: Array<CompleteItem>): Promise<number> {
  const receipt_result = await ReceiptsService.createReceipt(20, total_price.toString())
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()

  items.forEach(async (item) => {
    expect((await ReceiptItemsService.createReceiptItem(receipt.id, item.id, item.discount, item.eco_tax, item.quantity, item.warranty)).isOk()).toBeTruthy()
  })

  const transaction_result = await TransactionsService.createPendingTransaction(receipt.id, user, shop, 'card')
  expect(transaction_result.isOk()).toBeTruthy()
  const transaction = transaction_result._unsafeUnwrap()

  expect((await TransactionsService.updateTransactionStateFromId(transaction.id, 'validated')).isOk()).toBeTruthy()

  return receipt.id
}

function createBearerHeader(token: string): Object {
  return { Authorization: `Bearer ${token}` }
}

function approximateDate(date: Date, tolerance: number): boolean {
  return Math.abs(date.getTime() - new Date().getTime()) < tolerance
}

function compute_tax(price: string, tax_percentage: number): number {
  return Number((Number(price) * (1 + tax_percentage / 100)).toFixed(2))
}

describe('User receipts endpoint', () => {
  const endpoint = '/users/me/receipts'

  describe('List request', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(endpoint).set(createBearerHeader(user_infos.token)).send()
      const body: ReceiptModel = res.body[0]

      expect(res.statusCode).toEqual(200)
      expect(approximateDate(new Date(body.date), 60000)).toBeTruthy()
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toFixed(2)))
      expect(body.shop_name).toEqual(shop.name)
      expect(body.shop_logo !== undefined).toBeTruthy()
      expect(body.receipt_id).toEqual(receipt_id)
    })
  })

  describe('Details request', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(`${endpoint}/${receipt_id}`).set(createBearerHeader(user_infos.token)).send()
      const body: DetailedReceiptModel = res.body
      const vendor = body.vendor
      const products = body.products

      expect(res.statusCode).toEqual(200)
      expect(body.total_ht).toEqual(total_price)
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toFixed(2)))
      expect(body.tva_percentage).toEqual(20)
      expect(body.payment_type).toEqual('card')
      expect(approximateDate(new Date(body.creation_date), 60000))

      expect(vendor.name).toEqual(shop.name)
      expect(vendor.shop_number).toEqual(shop.phone)
      expect(vendor.place.street).toEqual(shop.place.address)
      expect(vendor.place.city).toEqual(shop.place.city)
      expect(vendor.place.postal_code).toEqual(shop.place.zipcode)
      expect(vendor.siret).toEqual(shop.siret)

      for (const i of Array(items.length).keys()) {
        expect(products[i].quantity).toEqual(items[i].quantity)
        expect(products[i].eco_tax).toEqual(items[i].eco_tax)
        expect(products[i].discount).toEqual(items[i].discount)
        expect(products[i].warranty).toEqual(items[i].warranty)
        expect(products[i].product_name).toEqual(items[i].name)
        expect(products[i].price_unit).toEqual(Number(items[i].price))
      }
    })

    it("should not allow a user to access another user's receipt", async () => {
      const user_infos = await setupUser(0)
      const second_user_infos = await setupUser(1)
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(`${endpoint}/${receipt_id}`).set(createBearerHeader(second_user_infos.token)).send()

      expect(res.statusCode).toEqual(404)
    })
  })
})

describe('Shop receipts endpoint', () => {
  const endpoint = '/shops/me/receipts'

  describe('List request', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(endpoint).set(createBearerHeader(shop_infos.token)).send()
      const body: ReceiptModel = res.body[0]
      const date = Date.now()

      expect(res.statusCode).toEqual(200)
      expect(Math.abs(date - new Date(body.date).getTime()) < 60000).toBeTruthy()
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toFixed(2)))
      expect(body.shop_name).toEqual(undefined)
      expect(body.shop_logo).toEqual(undefined)
      expect(body.receipt_id).toEqual(receipt_id)
    })
  })

  describe('Details request', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(`${endpoint}/${receipt_id}`).set(createBearerHeader(shop_infos.token)).send()
      const body: DetailedReceiptModel = res.body
      const products = body.products

      expect(res.statusCode).toEqual(200)
      expect(body.total_ht).toEqual(total_price)
      expect(body.tva_percentage).toEqual(20)
      expect(body.total_ttc).toEqual(compute_tax(String(total_price), 20))
      expect(body.payment_type).toEqual('card')

      for (const i of Array(items.length).keys()) {
        expect(products[i].quantity).toEqual(items[i].quantity)
        expect(products[i].eco_tax).toEqual(items[i].eco_tax)
        expect(products[i].discount).toEqual(items[i].discount)
        expect(products[i].warranty).toEqual(items[i].warranty)
        expect(products[i].product_name).toEqual(items[i].name)
        expect(products[i].price_unit).toEqual(Number(items[i].price))
      }
    })

    it("should not allow a shop to access another shop's receipt", async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop(0)
      const second_shop_infos = await setupShop(1)
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(`${endpoint}/${receipt_id}`).set(createBearerHeader(second_shop_infos.token)).send()

      expect(res.statusCode).toEqual(404)
    })
  })
})

describe('Receipt creation and validation', () => {
  const shop_transaction_endpoint = '/shops/me/transactions'
  const user_transaction_endpoint = '/users/me/transactions'
  const user_receipts_endpoint = '/users/me/receipts'
  const shop_receipts_endpoint = '/shops/me/receipts'

  it('basic test', async () => {
    const user_infos = await setupUser()
    const shop_infos = await setupShop()
    const user_token = createBearerHeader(user_infos.token)
    const shop_token = createBearerHeader(shop_infos.token)

    const creation_body: CreateTransactionRequestModel = {
      tva_percentage: 20,
      payment_method: 'card',
      total_price: String(total_price),
      items: shop_infos.items.map((item) => {
        return { shop_item_id: item.id, discount: item.discount, eco_tax: item.eco_tax, quantity: item.quantity, warranty: item.warranty }
      }),
    }

    const shop_res = await request(App).post(shop_transaction_endpoint).set(shop_token).send(creation_body)

    expect(shop_res.statusCode).toEqual(201)
    expect(typeof shop_res.body.id).toBe('number')
    expect(typeof shop_res.body.token).toBe('string')

    const user_res = await request(App).post(user_transaction_endpoint).set(user_token).send(shop_res.body)

    expect(user_res.statusCode).toEqual(204)

    const user_receipts_res = await request(App).get(user_receipts_endpoint).set(user_token).send()

    expect(user_receipts_res.statusCode).toEqual(200)
    expect(user_receipts_res.body.length).toEqual(1)
    expect(user_receipts_res.body[0].shop_name).toEqual(shop.name)
    expect(user_receipts_res.body[0].total_ttc).toEqual(compute_tax(String(total_price), 20))

    const shop_receipts_res = await request(App).get(shop_receipts_endpoint).set(shop_token).send()

    expect(shop_receipts_res.statusCode).toEqual(200)
    expect(shop_receipts_res.body.length).toEqual(1)
    expect(shop_receipts_res.body[0].total_ttc).toEqual(compute_tax(String(total_price), 20))
  })
})
