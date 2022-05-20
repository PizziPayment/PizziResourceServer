import { Request, Response } from 'express'
import { TransactionsService } from 'pizzi-db'
import { TransactionCreationModel } from '../models/create.request.model'
import { ApiFailure } from '../../common/models/api.response.model'
import { TransactionResponseModel } from '../models/response.model'

export async function createTransaction(req: Request<unknown, unknown, TransactionCreationModel>, res: Response): Promise<void> {
  await TransactionsService.createPendingTransaction(req.body.receipt_id, req.body.user_id, req.body.shop_id, req.body.payment_method).match(
    (transaction) => res.status(201).send(new TransactionResponseModel(transaction)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
