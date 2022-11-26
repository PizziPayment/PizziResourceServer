import { Application } from 'express'
import changeEmail from '../common/controllers/email.controller'
import changePassword from '../common/controllers/password.controller'
import { validAccessToken, validBasicAuth } from '../common/middlewares/authorization.middleware'
import { file_upload } from '../common/middlewares/file_upload.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import { validRequestBodyFor, validRequestParamsFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validUserTokenAffiliation from '../common/middlewares/user_token_affiliation.validation.middleware'
import ChangeEmailValidationModel from '../common/models/email.request.model'
import RequestPasswordModel from '../common/models/password.request.model'
import { ReceiptDetailsRequestModel } from '../common/models/receipts.request.model'
import {
  changeUserInformation,
  deleteAccount,
  getSharedReceipts,
  info,
  receipt,
  receipts,
  register,
  shareReceipt,
  takeTransaction,
  updateAvatar,
} from './controllers/user.controller'
import validUserReceiptAffiliation from './middlewares/receipt_affiliation.validation.middleware'
import validTakeTransactionRequest from './middlewares/take_transaction.validation.middleware'
import DeleteRequestModel from './models/delete.request.model'
import PatchRequestModel from './models/patch.request.model'
import { ReceiptsListRequestModel } from './models/receipt_list.request.model'
import RegisterRequestModel from './models/register.request.model'
import ShareReceiptRequestModel from './models/share_receipt.request.model'
import TakeTransactionRequestModel from './models/take_transaction.request.model'

export const baseUrl = '/users'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`
export const baseUrlReceipts = `${baseUrl}/me/receipts`
export const baseUrlSharedReceipts = `${baseUrl}/me/shared_receipts`
export const baseUrlTransactions = `${baseUrl}/me/transactions`
export const baseUrlAvatar = `${baseUrl}/me/avatar`

export default function UserRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validAccessToken, validUserTokenAffiliation, info])
  app.post(`${baseUrl}/`, [validRequestBodyFor(RegisterRequestModel.validator), validBasicAuth, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validRequestBodyFor(DeleteRequestModel.validator), validAccessToken, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validRequestBodyFor(PatchRequestModel.validator), validAccessToken, validUserTokenAffiliation, changeUserInformation])
  app.put(`${baseUrlPassword}/`, [validRequestBodyFor(RequestPasswordModel.validator), validAccessToken, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validRequestBodyFor(ChangeEmailValidationModel.validator), validAccessToken, validPassword, changeEmail])
  app.get(`${baseUrlReceipts}/:receipt_id`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validAccessToken,
    validUserTokenAffiliation,
    validUserReceiptAffiliation,
    receipt,
  ])
  app.post(`${baseUrlReceipts}/:receipt_id/share`, [
    validRequestParamsFor(ReceiptDetailsRequestModel.validator),
    validRequestBodyFor(ShareReceiptRequestModel.validator),
    validAccessToken,
    validUserTokenAffiliation,
    validUserReceiptAffiliation,
    shareReceipt,
  ])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validAccessToken, validUserTokenAffiliation, receipts])
  app.post(`${baseUrlTransactions}`, [
    validRequestBodyFor(TakeTransactionRequestModel.validator),
    validAccessToken,
    validUserTokenAffiliation,
    validTakeTransactionRequest,
    takeTransaction,
  ])
  app.post(`${baseUrlAvatar}`, [validAccessToken, validUserTokenAffiliation, file_upload.single('avatar'), updateAvatar])
  app.get(`${baseUrlSharedReceipts}/`, [validAccessToken, validUserTokenAffiliation, getSharedReceipts])
}
