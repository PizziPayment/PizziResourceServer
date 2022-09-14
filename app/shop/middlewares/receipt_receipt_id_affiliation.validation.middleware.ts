import { NextFunction, Request, Response } from 'express'
import { CredentialModel, DetailedReceiptModel } from 'pizzi-db'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import CreateProductReturnCertificateRequestModel from '../models/create_product_return_certificate.request.model'

export default async function validReceiptItemReceiptAffiliation(
  req: Request<{ receipt_id: number }, unknown, CreateProductReturnCertificateRequestModel>,
  res: Response<ApiResponseWrapper<unknown>, { credential: CredentialModel; receipt: DetailedReceiptModel }>,
  next: NextFunction,
): Promise<void> {
  if (res.locals.receipt.items.map((it) => it.id).includes(req.body.receipt_item_id)) {
    next()
  } else {
    res.status(404).send(new ApiFailure(req.url, 'Receipt item not found'))
  }
}
