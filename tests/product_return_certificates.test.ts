import { config } from '../app/common/config'
import {
  ClientsService,
  CredentialsService,
  EncryptionService,
  ProductReturnCertificateModel,
  ProductReturnCertificatesService,
  ReceiptItemsService,
  ReceiptsService,
  rewriteTables,
  ShopItemsService,
  ShopsServices,
  TokensService,
  TransactionsService,
  UsersServices,
} from 'pizzi-db'
import * as request from 'supertest'
import { client, shops, users } from './common/models'
import { App } from '../app/api'
import ReceiptItemModel from 'pizzi-db/dist/receipt_items/models/receipt_items.model'
import { createBearerHeader } from './common/services'

// @ts-ignore
let sequelize: Sequelize = undefined

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

afterEach(async () => await sequelize.close())

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
  price: number
  discount: number
  eco_tax: number
  quantity: number
  warranty: string
}

class CompleteItem extends Item {
  id: number
}

const items: Array<Item> = [
  { name: 'Outer Wilds', price: 1749, discount: 0, eco_tax: 0, quantity: 1, warranty: 'none' },
  { name: 'Outer Wilds - Echoes of the Eye', price: 1040, discount: 0, eco_tax: 0, quantity: 1, warranty: 'none' },
]

function getTotalPrice(items: Array<Item>): number {
  return items.map((item) => item.price).reduce((lhs, rhs) => lhs + rhs)
}

const tax_percentage = 20

async function setupShop(id?: number, shop_items: Array<Item> = items): Promise<{ id: number; items: Array<CompleteItem>; token: string }> {
  const shop = shops[id || 0]
  const shop_handle_result = await ShopsServices.createShop(shop.name, shop.phone, Number(shop.siret), shop.place.address, shop.place.city, shop.place.zipcode)
  expect(shop_handle_result.isOk()).toBeTruthy()
  const shop_handle = shop_handle_result._unsafeUnwrap()

  const items_total = []

  for (const item of shop_items) {
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

async function setupReceipt(
  user: number,
  shop: number,
  items: Array<CompleteItem>,
): Promise<{ id: number; total_price: number; date: Date; receipt_items: Array<ReceiptItemModel> }> {
  const total_price = getTotalPrice(items)
  const receipt_result = await ReceiptsService.createReceipt(tax_percentage, total_price)
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()
  const receipt_items = (
    await Promise.all(
      items.map(async (item) => ReceiptItemsService.createReceiptItem(receipt.id, item.id, item.discount, item.eco_tax, item.quantity, item.warranty)),
    )
  ).map((it) => it._unsafeUnwrap())

  const transaction_result = await TransactionsService.createPendingTransaction(receipt.id, user, shop, 'card')
  expect(transaction_result.isOk()).toBeTruthy()
  const transaction = transaction_result._unsafeUnwrap()

  expect((await TransactionsService.updateTransactionStateFromId(transaction.id, 'validated')).isOk()).toBeTruthy()

  return { id: receipt.id, total_price, date: transaction.created_at, receipt_items: receipt_items }
}

describe('Product Return Certificate endpoint', () => {
  const endpoint = (receipt_id: string) => `/shops/me/receipts/${receipt_id}/product_return_certificates`

  describe('Create certificate', () => {
    it('basic test with invalid receipt_id', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt = await setupReceipt(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).post(endpoint(receipt.id.toString())).set(createBearerHeader(shop_infos.token)).send({
        receipt_item_id: Number.MAX_VALUE,
        reason: 'reason',
        quantity: 10,
      })
      expect(res.statusCode).toEqual(404)
    })
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt = await setupReceipt(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).post(endpoint(receipt.id.toString())).set(createBearerHeader(shop_infos.token)).send({
        receipt_item_id: receipt.receipt_items[0].id,
        reason: 'reason',
        quantity: 10,
      })
      const body: ProductReturnCertificateModel = res.body

      expect(res.statusCode).toEqual(201)
      expect(body).not.toBeNull()
      expect(body.receipt_item_id).toBe(receipt.receipt_items[0].id)
      expect(body.quantity).toBe(10)
      expect(body.reason).toBe('reason')
    })
  })

  describe('List certificates', () => {
    it('basic test without certificates', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt = await setupReceipt(user_infos.id, shop_infos.id, shop_infos.items)

      const res = await request(App).get(endpoint(receipt.id.toString())).set(createBearerHeader(shop_infos.token)).send()
      const body: Array<ProductReturnCertificateModel> = res.body

      expect(res.statusCode).toEqual(200)
      expect(body).toHaveLength(0)
    })
    it('basic test with certificates', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt = await setupReceipt(user_infos.id, shop_infos.id, shop_infos.items)
      ;(await ProductReturnCertificatesService.createProductReturnCertificateFromReceiptItemId(receipt.receipt_items[0].id, 'reason', 10))._unsafeUnwrap()

      const res = await request(App).get(endpoint(receipt.id.toString())).set(createBearerHeader(shop_infos.token)).send()
      const body: Array<ProductReturnCertificateModel> = res.body

      expect(res.statusCode).toEqual(200)
      expect(body).toHaveLength(1)
      expect(body[0].receipt_item_id).toBe(receipt.receipt_items[0].id)
      expect(body[0].quantity).toBe(10)
    })
  })

  describe("List all shop's certificates", () => {
    const endpoint = '/shops/me/product_return_certificates'

    it('basic test with certificates', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt = await setupReceipt(user_infos.id, shop_infos.id, shop_infos.items)
      ;(await ProductReturnCertificatesService.createProductReturnCertificateFromReceiptItemId(receipt.receipt_items[0].id, 'reason', 10))._unsafeUnwrap()

      const res = await request(App).get(endpoint).set(createBearerHeader(shop_infos.token)).send()
      const body: Array<ProductReturnCertificateModel> = res.body

      expect(res.statusCode).toEqual(200)
      expect(body).toHaveLength(1)
      expect(body[0].receipt_item_id).toBe(receipt.receipt_items[0].id)
      expect(body[0].quantity).toBe(10)
    })
  })
})
