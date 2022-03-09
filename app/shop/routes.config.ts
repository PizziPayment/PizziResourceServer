import { Application } from 'express'
import { register, deleteAccount, shopInfo } from './controllers/shop.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validDeleteRequest from './middlewares/delete.request.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import changePassword from '../common/controllers/password.controller'
import validChangePasswordRequest from '../common/middlewares/password.request.validation.middleware'
import { validChangeEmailRequest } from '../common/middlewares/email.request.validation.middleware'
import changeEmail from '../common/controllers/email.controller'
import validShopTokenAffiliation from '../shop/middlewares/shop_token_affiliation.validation'

export const baseUrl = '/shops'
export const baseUrlPassword = `${baseUrl}/me/password`
export const baseUrlEmail = `${baseUrl}/me/email`

export default function ShopRouter(app: Application): void {
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, shopInfo])
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validDeleteRequest, validPassword, deleteAccount])
  app.put(`${baseUrlPassword}/`, [validToken, validChangePasswordRequest, validChangePassword, changePassword])
  app.patch(`${baseUrlEmail}/`, [validToken, validChangeEmailRequest, validPassword, changeEmail])
}
