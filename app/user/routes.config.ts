import { Application } from 'express'
import { register, deleteAccount, changeUserInformation } from './controllers/user.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validDeleteRequest from './middlewares/delete.request.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'
import validPassword, { validChangePassword } from '../common/middlewares/password.validation.middleware'
import validUserTokenAffiliation from './middlewares/userTokenAffiliation.validation.middleware'
import changePassword from '../common/controllers/password.controller'
import validChangePasswordRequest from '../common/middlewares/password.request.validation.middleware'
import { validChangeEmailRequest } from '../common/middlewares/email.request.validation.middleware'
import changeEmail from '../common/controllers/email.controller'

const baseUrl = '/users'

export default function UserRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
  app.delete(`${baseUrl}/`, [validToken, validDeleteRequest, validPassword, deleteAccount])
  app.patch(`${baseUrl}/`, [validToken, validUserTokenAffiliation, changeUserInformation])
  app.put('/user/password/', [validToken, validChangePasswordRequest, validChangePassword, changePassword])
  app.patch('/user/email/', [validToken, validChangeEmailRequest, validPassword, changeEmail])
}
