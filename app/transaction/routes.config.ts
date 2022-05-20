import { Application } from 'express'
import { createTransaction } from './controllers/transaction.controller'
import validToken from '../common/middlewares/token.validation.middleware'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import validCreateRequest from './middlewares/create.request.validation.middleware'

export const baseUrl = `/transactions`

export default function TransactionsRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validCreateRequest, createTransaction])
}
