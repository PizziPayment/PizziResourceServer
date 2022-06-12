import { Application } from 'express'
import { createTransaction, getTransactions, updateTransactionUser, updateTransactionPaymentMethod } from './controllers/transaction.controller'
import validToken from '../common/middlewares/token.validation.middleware'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import { validTransactionOwnership } from './middlewares/valid_ownership.validation.middleware'
import { validUpdateRequestForUser } from './middlewares/update.request.validation.middleware'
import { validRequestBodyFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import { TransactionCreationModel } from './models/create.request.model'
import { TransactionStateQuery } from './models/retrieve.request.model'
import { TransactionPaymentMethodUpdateModel, TransactionUserUpdateModel } from './models/update.request.model'

export const baseUrl = `/transactions`

export default function TransactionsRouter(app: Application): void {
  app.post(`${baseUrl}/`, [
    validRequestBodyFor(TransactionCreationModel.validator),
    validToken,
    validShopTokenAffiliation,
    createTransaction,
  ])
  app.get(`${baseUrl}/`, [validRequestQueryFor(TransactionStateQuery.validator), validToken, validShopTokenAffiliation, getTransactions])
  app.patch(`${baseUrl}/:id/user`, [
    validRequestBodyFor(TransactionUserUpdateModel.validator),
    validToken,
    validShopTokenAffiliation,
    validTransactionOwnership,
    validUpdateRequestForUser,
    updateTransactionUser,
  ])
  app.patch(`${baseUrl}/:id/payment_method`, [
    validRequestBodyFor(TransactionPaymentMethodUpdateModel.validator),
    validToken,
    validShopTokenAffiliation,
    validTransactionOwnership,
    updateTransactionPaymentMethod,
  ])
}
