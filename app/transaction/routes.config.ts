import { Application } from 'express'
import { validAccessToken } from '../common/middlewares/authorization.middleware'
import { validRequestBodyFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import { createTransaction, getTransactions, updateTransactionPaymentMethod, updateTransactionUser } from './controllers/transaction.controller'
import { validUpdateRequestForUser } from './middlewares/update.request.validation.middleware'
import { validTransactionOwnership } from './middlewares/valid_ownership.validation.middleware'
import { TransactionCreationModel } from './models/create.request.model'
import { TransactionStateQuery } from './models/retrieve.request.model'
import { TransactionPaymentMethodUpdateModel, TransactionUserUpdateModel } from './models/update.request.model'

export const baseUrl = `/transactions`

export default function TransactionsRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validRequestBodyFor(TransactionCreationModel.validator), validAccessToken, validShopTokenAffiliation, createTransaction])
  app.get(`${baseUrl}/`, [validRequestQueryFor(TransactionStateQuery.validator), validAccessToken, validShopTokenAffiliation, getTransactions])
  app.patch(`${baseUrl}/:id/user`, [
    validRequestBodyFor(TransactionUserUpdateModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    validTransactionOwnership,
    validUpdateRequestForUser,
    updateTransactionUser,
  ])
  app.patch(`${baseUrl}/:id/payment_method`, [
    validRequestBodyFor(TransactionPaymentMethodUpdateModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    validTransactionOwnership,
    updateTransactionPaymentMethod,
  ])
}
