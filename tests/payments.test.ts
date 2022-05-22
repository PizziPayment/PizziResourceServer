import { App } from '../app/api'
import { config } from '../app/common/config'
import { user, shops } from './common/models'
import * as request from 'supertest'
import { TransactionCreationModel } from '../app/transaction/models/create.request.model'
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

describe('Payment endpoints', () => {
  const endpoint = '/payments'

  it('basic test', async () => {
    const user_infos = await setupUser()
    const shop_infos = await setupShop()
    const receipt_id = await setupReceipts()
    const transaction = await setupTransaction(receipt_id, user_infos.id, shop_infos.id)

    expect(transaction.state).toBe('pending')
    const res = await request(App).post(`${endpoint}`).set(createBearerHeader(shop_infos.token)).send({
      transaction_id: transaction.id,
    })

    expect(res.statusCode).toBe(204)
    const updated_transaction = await TransactionsService.getTransactionById(transaction.id)
    expect(updated_transaction.isOk()).toBeTruthy()
    expect(updated_transaction._unsafeUnwrap().state).toBe('validated')
  })
})
