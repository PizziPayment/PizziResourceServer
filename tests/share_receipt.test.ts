import { App } from '../app/api'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { createBearerHeader } from './common/services'
import { users, shops, client } from './common/models'
import {
  ClientsService,
  CredentialsService,
  EncryptionService,
  ReceiptItemsService,
  ReceiptsService,
  rewriteTables,
  ShopItemsService,
  ShopsServices,
  TokensService,
  TransactionsService,
  UsersServices,
} from 'pizzi-db'
import ReceiptItemModel from 'pizzi-db/dist/receipt_items/models/receipt_items.model'

const sender = users[0]
const recipient = users[1]

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

const tax_percentage = 20

async function setupReceipt(user: number, shop: number): Promise<number> {
  const receipt_result = await ReceiptsService.createReceipt(tax_percentage, 0)
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()

  const transaction_result = await TransactionsService.createPendingTransaction(receipt.id, user, shop, 'card')
  expect(transaction_result.isOk()).toBeTruthy()
  const transaction = transaction_result._unsafeUnwrap()

  expect((await TransactionsService.updateTransactionStateFromId(transaction.id, 'validated')).isOk()).toBeTruthy()

  return receipt.id
}

async function setupShop(id?: number): Promise<number> {
  const shop = shops[id || 0]
  const shop_handle_result = await ShopsServices.createShop(shop.name, shop.phone, Number(shop.siret), shop.place.address, shop.place.city, shop.place.zipcode)
  expect(shop_handle_result.isOk()).toBeTruthy()
  const shop_handle = shop_handle_result._unsafeUnwrap()

  const items_total = []

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle.id, credentials.id)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return shop_handle.id
}

describe('Share receipt endpoint', () => {
  const endpoint = (receipt_id: number) => `/users/me/receipts/${receipt_id}/share`

  it('basic test with valid receipt_id', async () => {
    const sender = await setupUser(0)
    const receiver = await setupUser(1)
    const shop = await setupShop()
    const receipt_id = await setupReceipt(sender.id, shop)

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(204)
  })
  it('basic test with invalid receipt_id', async () => {
    const sender = await setupUser(0)
    const receiver = await setupUser(1)
    const shop = await setupShop()
    const receipt_id = await setupReceipt(sender.id, shop)

    const res = await request(App).post(endpoint(Number.MAX_VALUE)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(404)
  })
  it("test when sender don't own the receipt", async () => {
    const sender = await setupUser(0)
    const receiver = await setupUser(1)
    const shop = await setupShop()
    const receipt_id = await setupReceipt(receiver.id, shop)

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(404)
  })
  it("test whith invalid recipient email", async () => {
    const sender = await setupUser(0)
    const receiver = await setupUser(1)
    const shop = await setupShop()
    const receipt_id = await setupReceipt(sender.id, shop)

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: "invalid_email@invalid.email",
    })
    expect(res.statusCode).toEqual(400)
  })
})
