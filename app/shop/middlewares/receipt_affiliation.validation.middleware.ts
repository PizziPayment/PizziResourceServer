import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { CredentialModel, ReceiptsService, DetailedReceiptModel, TransactionsService, TransactionModel, ErrorCause } from 'pizzi-db'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { createResponseHandler } from '../../common/services/error_handling'

export default async function validShopReceiptAffiliation(
  req: Request<{ receipt_id: number }, unknown, ReceiptDetailsRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, { credential: CredentialModel; receipt: DetailedReceiptModel }>,
  next: NextFunction,
): Promise<void> {
  await ReceiptsService.getDetailedReceiptById(req.params.receipt_id)
    .andThen((receipt) =>
      TransactionsService.getTransactionByReceiptId(receipt.id).map((transaction): [DetailedReceiptModel, TransactionModel] => [receipt, transaction]),
    )
    .match(([receipt, transaction]) => {
      if (transaction.shop_id && transaction.shop_id == res.locals.credential.shop_id) {
        res.locals.receipt = receipt
        next()
      } else {
        res.status(404).send(new ApiFailure(req.url, 'Receipt not found'))
      }
    }, createResponseHandler(req, res, [[ErrorCause.ReceiptNotFound, 404, 'Receipt not found']]))
}
