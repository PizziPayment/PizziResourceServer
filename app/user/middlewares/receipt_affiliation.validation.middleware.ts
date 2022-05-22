import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ReceiptsService, DetailedReceiptModel, TransactionsService } from 'pizzi-db'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'

export default async function validUserReceiptAffiliation(
  req: Request<{ receipt_id: number }, unknown, ReceiptDetailsRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, { credential: CredentialModel; receipt: DetailedReceiptModel }>,
  next: NextFunction,
): Promise<void> {
  await ReceiptsService.getDetailedReceiptById(req.params.receipt_id).map((receipt) =>
    TransactionsService.getTransactionByReceiptId(receipt.id).match(
      (transaction) => {
        if (transaction.user_id && transaction.user_id == res.locals.credential.user_id) {
          res.locals.receipt = receipt
          next()
        } else {
          return res.status(403).send(new ApiFailure(req.url, 'Receipt not affiliated to this user'))
        }
      },
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    ),
  )
}
