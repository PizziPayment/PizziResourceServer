import { Request, Response } from 'express'
import { CredentialModel, TransactionsService } from 'pizzi-db'
import { TransactionCreationModel } from '../models/create.request.model'
import { TransactionResponseModel } from '../models/response.model'
import { TransactionStateQuery } from '../models/retrieve.request.model'
import { TransactionUserUpdateModel, TransactionPaymentMethodUpdateModel } from '../models/update.request.model'
import { createResponseHandler } from '../../common/services/error_handling'

export async function createTransaction(req: Request<unknown, unknown, TransactionCreationModel>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await TransactionsService.createPendingTransaction(req.body.receipt_id, req.body.user_id, credentials.shop_id, req.body.payment_method).match(
    (transaction) => res.status(201).send(new TransactionResponseModel(transaction)),
    createResponseHandler(req, res),
  )
}

export async function getTransactions(req: Request<unknown, unknown, TransactionCreationModel, TransactionStateQuery>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await TransactionsService.getOwnerTransactionsByState('shop', credentials.shop_id, req.query.state).match(
    (transactions) => res.status(200).send(transactions.map((transaction) => new TransactionResponseModel(transaction))),
    createResponseHandler(req, res),
  )
}

export async function updateTransactionUser(req: Request<{ id: number }, unknown, TransactionUserUpdateModel>, res: Response): Promise<void> {
  await TransactionsService.updateTransactionUserIdFromId(req.params.id, req.body.user_id).match(() => res.status(204).send(), createResponseHandler(req, res))
}

export async function updateTransactionPaymentMethod(req: Request<{ id: number }, unknown, TransactionPaymentMethodUpdateModel>, res: Response): Promise<void> {
  await TransactionsService.updateTransactionPaymentMethodFromId(req.params.id, req.body.payment_method).match(
    () => res.status(204).send(),
    createResponseHandler(req, res),
  )
}
