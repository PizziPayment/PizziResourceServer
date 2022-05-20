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
import { user, shops } from './common/models'
import { ReceiptListModel, ReceiptModel } from '../app/user/models/receipt_list.model'
import { DetailedReceiptModel } from '../app/user/models/detailed_receipt'

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}

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

async function setupUser(): Promise<{ token: string; id: number }> {
  const user_handle_result = await UsersServices.createUser(user.name, user.surname, '', user.place.zipcode)
  expect(user_handle_result.isOk())
  const user_handle = user_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('user', user_handle.id, user.email, EncryptionService.encrypt(user.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return { token: token.access_token, id: user_handle.id }
}

const items = [
  { name: 'Outer Wilds', price: '17.4916' },
  { name: 'Outer Wilds - Echoes of the Eye', price: '10.4083' },
]
const total_price = Number(
  items
    .map((item) => Number(item.price))
    .reduce((lhs, rhs) => lhs + rhs)
    .toFixed(2),
)

async function setupShop(): Promise<{ id: number; items: Array<number>; token: string }> {
  const shop_handle_result = await ShopsServices.createShop(shop.name, shop.phone, '', shop.place.zipcode)
  expect(shop_handle_result.isOk()).toBeTruthy()
  const shop_handle = shop_handle_result._unsafeUnwrap()

  const items_handles = []

  for (const item of items) {
    const item_handle_result = await ShopItemsService.createShopItem(shop_handle.id, item.name, item.price)
    expect(item_handle_result.isOk()).toBeTruthy()
    const item_handle = item_handle_result._unsafeUnwrap()

    items_handles.push(item_handle.id)
  }

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return { id: shop_handle.id, items: items_handles, token: token.access_token }
}

async function setupReceipts(user: number, shop: number, items: Array<number>): Promise<number> {
  const receipt_result = await ReceiptsService.createReceipt(20, total_price.toString())
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()

  items.forEach(async (item) => {
    expect((await ReceiptItemsService.createReceiptItem(receipt.id, item, 0, 0, 1, 'non')).isOk()).toBeTruthy()
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

describe('User receipts endpoint', () => {
  const endpoint = '/users/receipts'

  describe('List request', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(endpoint).set(createBearerHeader(user_infos.token)).send()
      const body: ReceiptModel = res.body[0]
      const date = Date.now()

      expect(res.statusCode).toEqual(200)
      expect(Math.abs(date - new Date(body.date).getTime()) < 60000).toBeTruthy()
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toString()))
      expect(body.shop_name).toEqual(shop.name) // Not functionnal
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

      expect(res.statusCode).toEqual(200)
      expect(body.total_ht).toEqual(total_price)
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toString()))
      expect(body.tva_percentage).toEqual(20)
      expect(body.payment_type).toEqual('card')
    })
  })
})

describe('Shop receipts endpoint', () => {
  const endpoint = '/shops/receipts'

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
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toString()))
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

      expect(res.statusCode).toEqual(200)
      expect(body.total_ht).toEqual(total_price)
      expect(body.total_ttc).toEqual(Number((total_price * 1.2).toString()))
      expect(body.tva_percentage).toEqual(20)
      expect(body.payment_type).toEqual('card')
    })
  })
})
