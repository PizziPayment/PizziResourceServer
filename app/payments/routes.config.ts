import { Application } from 'express'
import { proceedPayment } from './controllers/payment.controller'
import validToken from '../common/middlewares/token.validation.middleware'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import validPaymentRequest from './middlewares/payment_request.validation.middleware'

export const baseUrl = '/payments'

export default function PaymentRouter(app: Application): void {
  // This is a dummy route, it only "validate" a given transaction from its id
  // it needs a shop's accreditation to work and will only be used in the purpose
  // of the beta.
  app.post(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validPaymentRequest, proceedPayment])
}
