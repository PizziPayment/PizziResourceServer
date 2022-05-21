import { Request, Response } from 'express'
import { CredentialModel, TransactionsService } from 'pizzi-db'
import { TransactionCreationModel } from '../models/create.request.model'
import { ApiFailure } from '../../common/models/api.response.model'
import { TransactionResponseModel } from '../models/response.model'
import { TransactionStateQuery } from '../models/retrieve.request.model'

export async function createTransaction(req: Request<unknown, unknown, TransactionCreationModel>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await TransactionsService.createPendingTransaction(req.body.receipt_id, req.body.user_id, credentials.shop_id, req.body.payment_method).match(
    (transaction) => res.status(201).send(new TransactionResponseModel(transaction)),
    (e) => {
      console.log(e)
      return res.status(500).send(new ApiFailure(req.url, 'Internal error'))
    },
  )
}

export async function getTransactions(req: Request<unknown, unknown, TransactionCreationModel, TransactionStateQuery>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await TransactionsService.getOwnerTransactionsByState('shop', credentials.shop_id, req.query.state).match(
    (transactions) => res.status(200).send(transactions.map((transaction) => new TransactionResponseModel(transaction))),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
