import { Application } from 'express'
import changeEmail from '../common/controllers/email.controller'
import changePassword from '../common/controllers/password.controller'
import { validAccessToken, validBasicAuth } from '../common/middlewares/authorization.middleware'
import { file_upload } from '../common/middlewares/file_upload.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import { validRequestBodyFor, validRequestParamsFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import { validShopTokenAffiliation } from '../common/middlewares/token_affiliation.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import ChangeEmailValidationModel from '../common/models/email.request.model'
import RequestPasswordModel from '../common/models/password.request.model'
import { ReceiptDetailsRequestModel } from '../common/models/receipts.request.model'
import {
  changeShopInformation,
  createProductReturnCertificate,
  createTransaction,
  deleteAccount,
  receipt,
  receipts,
  register,
  shopInfo,
  productReturnCertificates,
  updateAvatar,
} from './controllers/shop.controller'
import validShopReceiptAffiliation from './middlewares/receipt_affiliation.validation.middleware'
import validReceiptItemReceiptAffiliation from './middlewares/receipt_receipt_id_affiliation.validation.middleware'
import CreateProductReturnCertificateRequestModel from './models/create_product_return_certificate.request.model'
import CreateTransactionRequestModel from './models/create_transaction.request.model'
import DeleteRequestModel from './models/delete.request.model'
import { PatchRequestModel } from './models/patch.request.model'
import { ReceiptsListRequestModel } from './models/receipt_list.request.model'
import RegisterRequestModel from './models/register.request.model'

export const baseUrl = '/shops'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`
export const baseUrlReceipts = `${baseUrl}/me/receipts`
export const baseUrlProductReturnCertificate = `${baseUrlReceipts}/:receipt_id/product_return_certificates`
export const baseUrlTransactions = `${baseUrl}/me/transactions`
export const baseUrlAvatar = `${baseUrl}/me/avatar`

export default function ShopRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validAccessToken, validShopTokenAffiliation, shopInfo])
  app.post(`${baseUrl}/`, [validRequestBodyFor(RegisterRequestModel.validator), validBasicAuth, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validRequestBodyFor(DeleteRequestModel.validator), validAccessToken, validShopTokenAffiliation, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validRequestBodyFor(PatchRequestModel.validator), validAccessToken, validShopTokenAffiliation, changeShopInformation])
  app.put(`${baseUrlPassword}/`, [validRequestBodyFor(RequestPasswordModel.validator), validAccessToken, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validRequestBodyFor(ChangeEmailValidationModel.validator), validAccessToken, validPassword, changeEmail])
  app.get(`${baseUrlReceipts}/:receipt_id`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    validShopReceiptAffiliation,
    receipt,
  ])
  app.get(`${baseUrlProductReturnCertificate}/`, [validAccessToken, validShopTokenAffiliation, validShopReceiptAffiliation, productReturnCertificates])
  app.post(`${baseUrlProductReturnCertificate}/`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validRequestBodyFor(CreateProductReturnCertificateRequestModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    validShopReceiptAffiliation,
    validReceiptItemReceiptAffiliation, // needs to be after validShopReceiptAffiliation.
    createProductReturnCertificate,
  ])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validAccessToken, validShopTokenAffiliation, receipts])
  app.get(`${baseUrl}/me/product_return_certificates`, [validAccessToken, validShopTokenAffiliation, productReturnCertificates])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validAccessToken, validShopTokenAffiliation, receipts])
  app.post(`${baseUrlTransactions}/`, [
    validRequestBodyFor(CreateTransactionRequestModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    createTransaction,
  ])
  app.post(`${baseUrlAvatar}`, [validAccessToken, validShopTokenAffiliation, file_upload.single('avatar'), updateAvatar])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validAccessToken, validShopTokenAffiliation, receipts])
  app.post(`${baseUrlTransactions}/`, [
    validRequestBodyFor(CreateTransactionRequestModel.validator),
    validAccessToken,
    validShopTokenAffiliation,
    createTransaction,
  ])
}
