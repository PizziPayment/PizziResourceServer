import { Request, Response } from 'express'
import { TransactionsService } from 'pizzi-db'
import { PaymentRequestModel } from '../models/payment.request.model'
import { ApiFailure } from '../../common/models/api.response.model'

export async function proceedPayment(req: Request<unknown, unknown, PaymentRequestModel>, res: Response): Promise<void> {
  await TransactionsService.updateTransactionStateFromId(req.body.transaction_id, 'validated').match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal server error')),
  )
}
