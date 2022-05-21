import { App } from '../app/api'
import { config } from '../app/common/config'
import {
  ClientsService,
  CredentialsService,
  EncryptionService,
  ReceiptsService,
  rewriteTables,
  ShopsServices,
  TokensService,
  TransactionModel,
  TransactionsService,
  UsersServices,
} from 'pizzi-db'
import { user, shops } from './common/models'
import * as request from 'supertest'
import { TransactionCreationModel } from '../app/transaction/models/create.request.model'

const client = { client_id: 'toto', client_secret: 'tutu' }
const shop = shops[0]

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

afterEach(async () => {
  return sequelize.close()
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

async function setupShop(): Promise<{ id: number; token: string }> {
  const shop_handle_result = await ShopsServices.createShop(shop.name, shop.phone, 21, shop.place.address, shop.place.city, shop.place.zipcode)
  expect(shop_handle_result.isOk()).toBeTruthy()
  const shop_handle = shop_handle_result._unsafeUnwrap()

  const client_handle_result = await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret)
  expect(client_handle_result.isOk()).toBeTruthy()
  const client_handle = client_handle_result._unsafeUnwrap()

  const credentials_result = await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))
  expect(credentials_result.isOk())
  const credentials = credentials_result._unsafeUnwrap()

  const token_result = await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials)
  expect(token_result.isOk()).toBeTruthy()
  const token = token_result._unsafeUnwrap()

  return { id: shop_handle.id, token: token.access_token }
}

async function setupReceipts(): Promise<number> {
  const receipt_result = await ReceiptsService.createReceipt(20, '0')
  expect(receipt_result.isOk()).toBeTruthy()
  const receipt = receipt_result._unsafeUnwrap()

  return receipt.id
}

async function setupTransaction(receipt_id: number, user_id: number, shop_id: number): Promise<TransactionModel> {
  const transaction_result = await TransactionsService.createPendingTransaction(receipt_id, user_id, shop_id, 'unassigned')
  expect(transaction_result.isOk()).toBeTruthy()
  const transaction = transaction_result._unsafeUnwrap()

  return transaction
}

function createBearerHeader(token: string): Object {
  return { Authorization: `Bearer ${token}` }
}

describe('Transactions endpoint', () => {
  const endpoint = '/transactions'

  describe('Create transaction', () => {
    it('basic test', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction: TransactionCreationModel = {
        receipt_id: receipt_id,
        user_id: user_infos.id,
        payment_method: 'unassigned',
      }

      const res = await request(App).post(`${endpoint}`).set(createBearerHeader(shop_infos.token)).send(expected_transaction)
      const body: TransactionModel = res.body
      const date = Date.now()

      expect(res.statusCode).toEqual(201)
      expect(Math.abs(date - new Date(body.created_at).getTime()) < 60000).toBeTruthy()
      expect(body.receipt_id).toEqual(expected_transaction.receipt_id)
      expect(body.user_id).toEqual(expected_transaction.user_id)
      expect(body.shop_id).toEqual(shop_infos.id)
    })

    it('basic test without user_id', async () => {
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction: TransactionCreationModel = {
        receipt_id: receipt_id,
        user_id: null,
        payment_method: 'unassigned',
      }

      const res = await request(App).post(`${endpoint}`).set(createBearerHeader(shop_infos.token)).send(expected_transaction)
      const body: TransactionModel = res.body
      const date = Date.now()

      expect(res.statusCode).toEqual(201)
      expect(Math.abs(date - new Date(body.created_at).getTime()) < 60000).toBeTruthy()
      expect(body.receipt_id).toEqual(expected_transaction.receipt_id)
      expect(body.user_id).toBeFalsy()
    })
  })

  describe('Get transactions', () => {
    it('basic test with "pending" sate', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction = await setupTransaction(receipt_id, user_infos.id, shop_infos.id)

      const res = await request(App).get(`${endpoint}?state=pending`).set(createBearerHeader(shop_infos.token)).send()
      const body = res.body
      const date = Date.now()

      expect(res.statusCode).toEqual(200)
      expect(body).toHaveLength(1)
      expect(Math.abs(date - new Date(body[0].created_at).getTime()) < 60000).toBeTruthy()
      expect(body[0].receipt_id).toEqual(expected_transaction.receipt_id)
      expect(body[0].user_id).toEqual(expected_transaction.user_id)
    })

    it('basic test with "validated" state', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction = await setupTransaction(receipt_id, user_infos.id, shop_infos.id)

      const res = await request(App).get(`${endpoint}?state=validated`).set(createBearerHeader(shop_infos.token)).send()
      const body = res.body

      expect(res.statusCode).toEqual(200)
      expect(body).toHaveLength(0)
    })

    it('basic test with invalid state', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction = await setupTransaction(receipt_id, user_infos.id, shop_infos.id)

      const res = await request(App).get(`${endpoint}?state=invalid_state`).set(createBearerHeader(shop_infos.token)).send()

      expect(res.statusCode).toEqual(400)
    })

    it('basic test without state', async () => {
      const user_infos = await setupUser()
      const shop_infos = await setupShop()
      const receipt_id = await setupReceipts()
      const expected_transaction = await setupTransaction(receipt_id, user_infos.id, shop_infos.id)

      const res = await request(App).get(`${endpoint}`).set(createBearerHeader(shop_infos.token)).send()

      expect(res.statusCode).toEqual(400)
    })
  })
})
