import { Application } from 'express'
import { createTransaction, getTransactions, updateTransactionUser, updateTransactionPaymentMethod } from './controllers/transaction.controller'
import validToken from '../common/middlewares/token.validation.middleware'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import validCreateRequest from './middlewares/create.request.validation.middleware'
import { validTransactionRetrievalQuery } from './middlewares/retrieve_param.validation.middlewares'
import { validTransactionOwnership } from './middlewares/valid_ownership.validation.middleware'
import { validUpdateRequestForPaymentMethod, validUpdateRequestForUser } from './middlewares/update.request.validation.middleware'

export const baseUrl = `/transactions`

export default function TransactionsRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validCreateRequest, createTransaction])
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validTransactionRetrievalQuery, getTransactions])
  app.patch(`${baseUrl}/:id/user`, [validToken, validShopTokenAffiliation, validTransactionOwnership, validUpdateRequestForUser, updateTransactionUser])
  app.patch(`${baseUrl}/:id/payment_method`, [
    validToken,
    validShopTokenAffiliation,
    validTransactionOwnership,
    validUpdateRequestForPaymentMethod,
    updateTransactionPaymentMethod,
  ])
}
