import { Application } from 'express'
import { register, deleteAccount } from './controllers/shop.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validDeleteRequest from './middlewares/delete.request.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import { changeShopPassword } from './controllers/password.controller'
import validChangePasswordRequest from './middlewares/password.request.validation.middleware'

const baseUrl = '/shops'

export default function ShopRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validDeleteRequest, validPassword, deleteAccount])
  app.put(`/shop/password/`, [validToken, validChangePasswordRequest, validChangePassword, changeShopPassword])
}
