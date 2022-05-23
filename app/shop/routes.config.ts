import { Application } from 'express'
import changeEmail from '../common/controllers/email.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validDeleteRequest from './middlewares/delete.request.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import changePassword from '../common/controllers/password.controller'
import { validChangeEmailRequest } from '../common/middlewares/email.request.validation.middleware'
import validChangePasswordRequest from '../common/middlewares/password.request.validation.middleware'
import { changeShopInformation, deleteAccount, register, shopInfo, receipts, receipt, createTransaction } from './controllers/shop.controller'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import validReceiptsRequest from '../common/middlewares/receipts.validation.middleware'
import validShopReceiptAffiliation from './middlewares/receipt_affiliation.validation.middleware'
import validCreateTransactionRequest from './middlewares/create_transaction.request.validation.middleware'

export const baseUrl = '/shops'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`
export const baseUrlReceipts = `${baseUrl}/me/receipts`
export const baseUrlTransactions = `${baseUrl}/me/transactions`

export default function ShopRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, shopInfo])
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validDeleteRequest, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validToken, validShopTokenAffiliation, changeShopInformation])
  app.put(`${baseUrlPassword}/`, [validToken, validChangePasswordRequest, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validToken, validChangeEmailRequest, validPassword, changeEmail])
  app.get(`${baseUrlReceipts}/:receipt_id`, [validToken, validShopTokenAffiliation, validShopReceiptAffiliation, receipt])
  app.get(`${baseUrlReceipts}/`, [validToken, validShopTokenAffiliation, validReceiptsRequest, receipts])
  app.post(`${baseUrlTransactions}/`, [validToken, validShopTokenAffiliation, validCreateTransactionRequest, createTransaction])
}
