import { App } from '../app/api'
import { config } from '../app/common/config'
import * as request from 'supertest'
import { createBearerHeader, createShop } from './common/services'
import { users, shops, client } from './common/models'
import {
  ClientsService,
  CredentialsService,
  EncryptionService,
  ReceiptModel,
  ReceiptsService,
  rewriteTables,
  SharedReceiptsService,
  TokensService,
  TransactionsService,
  UserModel,
  UsersServices,
} from 'pizzi-db'

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

async function setupUser(id?: number): Promise<{ token: string; id: number; user_handle: UserModel }> {
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

  return { token: token.access_token, id: user_handle.id, user_handle }
}

async function setupReceipt(user: number, shop: number): Promise<ReceiptModel> {
  const receipt_result = await ReceiptsService.createReceipt(0)
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()

  const transaction_result = await TransactionsService.createPendingTransaction(receipt.id, user, shop, 'card')
  expect(transaction_result.isOk()).toBeTruthy()
  const transaction = transaction_result._unsafeUnwrap()

  expect((await TransactionsService.updateTransactionStateFromId(transaction.id, 'validated')).isOk()).toBeTruthy()

  return receipt
}

async function setupShop(id?: number): Promise<number> {
  return createShop(shops[id || 0]).then((shop_handle) => shop_handle.id)
}

describe('Share receipt endpoint', () => {
  const endpoint = (receipt_id: number) => `/users/me/receipts/${receipt_id}/share`

  it('basic test with valid receipt_id', async () => {
    const sender = await setupUser(0)
    await setupUser(1)
    const shop = await setupShop()
    const receipt_id = (await setupReceipt(sender.id, shop)).id

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(204)
  })

  it('basic test with invalid receipt_id', async () => {
    const sender = await setupUser(0)
    await setupUser(1)
    const shop = await setupShop()
    await setupReceipt(sender.id, shop)

    const res = await request(App).post(endpoint(Number.MAX_VALUE)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(404)
  })

  it("test when sender doesn't own the receipt", async () => {
    const sender = await setupUser(0)
    const receiver = await setupUser(1)
    const shop = await setupShop()
    const receipt_id = (await setupReceipt(receiver.id, shop)).id

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: users[1].email,
    })
    expect(res.statusCode).toEqual(404)
  })

  it('test whith invalid recipient email', async () => {
    const sender = await setupUser(0)
    await setupUser(1)
    const shop = await setupShop()
    const receipt_id = (await setupReceipt(sender.id, shop)).id

    const res = await request(App).post(endpoint(receipt_id)).set(createBearerHeader(sender.token)).send({
      recipient_email: 'invalid_email@invalid.email',
    })
    expect(res.statusCode).toEqual(400)
  })

  describe('List shared receipts', () => {
    const endpoint = '/users/me/shared_receipts'

    it('basic test', async () => {
      const sender = await setupUser(0)
      const receiver = await setupUser(1)
      const shop = await setupShop()
      const receipt = await setupReceipt(sender.id, shop)
      const shared_receipt = (await SharedReceiptsService.shareReceiptByEmail(receipt.id, users[1].email))._unsafeUnwrap()

      const res = await request(App).get(endpoint).set(createBearerHeader(receiver.token))

      expect(res.statusCode).toEqual(200)
      expect(res.body[0].receipt.id).toEqual(receipt.id)
      expect(res.body[0].receipt.total_price).toEqual(receipt.total_price)
      expect(res.body[0].id).toEqual(shared_receipt.id)
      expect(new Date(res.body[0].shared_at)).toEqual(shared_receipt.shared_at)
      expect(res.body[0].user.firstname).toEqual(sender.user_handle.firstname)
      expect(res.body[0].user.surname).toEqual(sender.user_handle.surname)
      expect(res.body[0].user.avatar_id).toEqual(sender.user_handle.avatar_id)
    })
    it('basic test with filter that should find', async () => {
      const sender = await setupUser(0)
      const receiver = await setupUser(1)
      const shop = await setupShop()
      const receipt = await setupReceipt(sender.id, shop)
      const shared_receipt = (await SharedReceiptsService.shareReceiptByEmail(receipt.id, users[1].email))._unsafeUnwrap()

      const res = await request(App).get(`${endpoint}/?query=${shops[0].name}`).set(createBearerHeader(receiver.token))

      expect(res.statusCode).toEqual(200)
      expect(res.body[0].receipt.id).toEqual(receipt.id)
      expect(res.body[0].receipt.total_price).toEqual(receipt.total_price)
      expect(res.body[0].id).toEqual(shared_receipt.id)
      expect(new Date(res.body[0].shared_at)).toEqual(shared_receipt.shared_at)
      expect(res.body[0].user.firstname).toEqual(sender.user_handle.firstname)
      expect(res.body[0].user.surname).toEqual(sender.user_handle.surname)
      expect(res.body[0].user.avatar_id).toEqual(sender.user_handle.avatar_id)
    })
    it("basic test with filter that shouldn't find", async () => {
      const sender = await setupUser(0)
      const receiver = await setupUser(1)
      const shop = await setupShop()
      const receipt = await setupReceipt(sender.id, shop)
      const shared_receipt = (await SharedReceiptsService.shareReceiptByEmail(receipt.id, users[1].email))._unsafeUnwrap()

      const res = await request(App).get(`${endpoint}/?query=GLABOUBIOQUE`).set(createBearerHeader(receiver.token))

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveLength(0)
    })
  })
})
