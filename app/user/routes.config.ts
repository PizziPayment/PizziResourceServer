import { Application } from 'express'
import { register, deleteAccount, changeUserInformation } from './controllers/user.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validDeleteRequest from './middlewares/delete.request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validPassword from '../common/middlewares/password.validation.middleware'
import validPatchRequest from './middlewares/patch.request.validation.middleware'

const baseUrl = '/users'

export default function UserRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validDeleteRequest, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validToken, validPatchRequest, changeUserInformation])
}
