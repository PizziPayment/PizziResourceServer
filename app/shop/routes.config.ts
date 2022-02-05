import { Application } from 'express'
import { register, deleteAccount } from './controllers/shop.controller'
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

const baseUrl = '/shops'

export default function ShopRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validDeleteRequest, validPassword, deleteAccount])
  app.put(`/shop/password/`, [validToken, validChangePasswordRequest, validChangePassword, changePassword])
  app.patch('/shop/email', [validToken, validChangeEmailRequest, validPassword, changeEmail])
}
