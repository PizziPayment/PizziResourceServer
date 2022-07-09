import { Application } from 'express'
import { register, deleteAccount, changeUserInformation, info, receipts, receipt, takeTransaction } from './controllers/user.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import validUserTokenAffiliation from '../common/middlewares/user_token_affiliation.validation.middleware'
import changePassword from '../common/controllers/password.controller'
import changeEmail from '../common/controllers/email.controller'
import validUserReceiptAffiliation from './middlewares/receipt_affiliation.validation.middleware'
import validTakeTransactionRequest from './middlewares/take_transaction.validation.middleware'
import { validRequestBodyFor, validRequestParamsFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import RegisterRequestModel from './models/register.request.model'
import DeleteRequestModel from './models/delete.request.model'
import PatchRequestModel from './models/patch.request.model'
import RequestPasswordModel from '../common/models/password.request.model'
import ChangeEmailValidationModel from '../common/models/email.request.model'
import { ReceiptDetailsRequestModel } from '../common/models/receipts.request.model'
import { ReceiptsListRequestModel } from './models/receipt_list.request.model'
import TakeTransactionRequestModel from './models/take_transaction.request.model'

export const baseUrl = '/users'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`
export const baseUrlReceipts = `${baseUrl}/me/receipts`
export const baseUrlTransactions = `${baseUrl}/me/transactions`

export default function UserRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validToken, validUserTokenAffiliation, info])
  app.post(`${baseUrl}/`, [validRequestBodyFor(RegisterRequestModel.validator), validBasicAuth, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validRequestBodyFor(DeleteRequestModel.validator), validToken, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validRequestBodyFor(PatchRequestModel.validator), validToken, validUserTokenAffiliation, changeUserInformation])
  app.put(`${baseUrlPassword}/`, [validRequestBodyFor(RequestPasswordModel.validator), validToken, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validRequestBodyFor(ChangeEmailValidationModel.validator), validToken, validPassword, changeEmail])
  app.get(`${baseUrlReceipts}/:receipt_id`, [validRequestParamsFor(ReceiptDetailsRequestModel.validator), validToken, validUserTokenAffiliation, validUserReceiptAffiliation, receipt])
  app.get(`${baseUrlReceipts}/`, [validRequestQueryFor(ReceiptsListRequestModel.validator), validToken, validUserTokenAffiliation, receipts])
  app.post(`${baseUrlTransactions}`, [
    validRequestBodyFor(TakeTransactionRequestModel.validator),
    validToken,
    validUserTokenAffiliation,
    validTakeTransactionRequest,
    takeTransaction,
  ])
}
