import { Application } from 'express'
import changeEmail from '../common/controllers/email.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import changePassword from '../common/controllers/password.controller'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import {
  changeShopInformation,
  createProductReturnCertificate,
  createTransaction,
  deleteAccount,
  productReturnCertificates,
  receipt,
  receipts,
  register,
  shopInfo,
} from './controllers/shop.controller'
import validShopReceiptAffiliation from './middlewares/receipt_affiliation.validation.middleware'
import { validRequestBodyFor, validRequestParamsFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import RegisterRequestModel from './models/register.request.model'
import DeleteRequestModel from './models/delete.request.model'
import { PatchRequestModel } from './models/patch.request.model'
import RequestPasswordModel from '../common/models/password.request.model'
import ChangeEmailValidationModel from '../common/models/email.request.model'
import { ReceiptDetailsRequestModel } from '../common/models/receipts.request.model'
import CreateTransactionRequestModel from './models/create_transaction.request.model'
import { ReceiptsListRequestModel } from './models/receipt_list.request.model'
import CreateProductReturnCertificateRequestModel from './models/create_product_return_certificate.request.model'
import validReceiptItemReceiptAffiliation from './middlewares/receipt_receipt_id_affiliation.validation.middleware'

export const baseUrl = '/shops'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`
export const baseUrlReceipts = `${baseUrl}/me/receipts`
export const baseUrlProductReturnCertificate = `${baseUrlReceipts}/:receipt_id/product_return_certificates`
export const baseUrlTransactions = `${baseUrl}/me/transactions`

export default function ShopRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, shopInfo])
  app.post(`${baseUrl}/`, [validRequestBodyFor(RegisterRequestModel.validator), validBasicAuth, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validRequestBodyFor(DeleteRequestModel.validator), validToken, validShopTokenAffiliation, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validRequestBodyFor(PatchRequestModel.validator), validToken, validShopTokenAffiliation, changeShopInformation])
  app.put(`${baseUrlPassword}/`, [validRequestBodyFor(RequestPasswordModel.validator), validToken, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validRequestBodyFor(ChangeEmailValidationModel.validator), validToken, validPassword, changeEmail])
  app.get(`${baseUrlReceipts}/:receipt_id`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validToken,
    validShopTokenAffiliation,
    validShopReceiptAffiliation,
    receipt,
  ])
  app.get(`${baseUrlProductReturnCertificate}/`, [validToken, validShopTokenAffiliation, validShopReceiptAffiliation, productReturnCertificates])
  app.post(`${baseUrlProductReturnCertificate}/`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validRequestBodyFor(CreateProductReturnCertificateRequestModel.validator),
    validToken,
    validShopTokenAffiliation,
    validShopReceiptAffiliation,
    validReceiptItemReceiptAffiliation, // needs to be after validShopReceiptAffiliation.
    createProductReturnCertificate,
  ])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validToken, validShopTokenAffiliation, receipts])
  app.post(`${baseUrlTransactions}/`, [validRequestBodyFor(CreateTransactionRequestModel.validator), validToken, validShopTokenAffiliation, createTransaction])
}
