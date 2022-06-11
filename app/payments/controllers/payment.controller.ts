import { Request, Response } from 'express'
import { TransactionsService } from 'pizzi-db'
import { PaymentRequestModel } from '../models/payment.request.model'
import { createResponseHandler } from '../../common/services/error_handling'

export async function proceedPayment(req: Request<unknown, unknown, PaymentRequestModel>, res: Response): Promise<void> {
  await TransactionsService.updateTransactionStateFromId(req.body.transaction_id, 'validated').match(
    () => res.status(204).send(),
    createResponseHandler(req, res),
  )
}
