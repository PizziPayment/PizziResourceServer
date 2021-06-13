import { Application } from 'express'
import { register, deleteAccount } from './controllers/shop.controller'
import validBasicAuth from '../common/middlewares/basic_auth.validation.middleware'
import validRegisterRequest from './middlewares/register.request.validation.middleware'
import validUniqueEmail from './middlewares/unique_email.validation.middleware'
import validToken from '../common/middlewares/token.validation.middleware'

const baseUrl = '/shop'

export default function ShopRouter(app: Application): void {
    app.post(`${baseUrl}/`, [validBasicAuth, validRegisterRequest, validUniqueEmail, register])
    app.delete(`${baseUrl}/`, [validToken, deleteAccount])
}
