import { Application } from 'express'
import validToken from '../common/middlewares/token.validation.middleware'
import validUserTokenAffiliation from '../user/middlewares/userTokenAffiliation.validation.middleware'
import { receipts } from './controllers/receipts.controller'
import validReceiptsRequest from './middlewares/receipts.validation.middleware'

const baseUrl = '/receipts'

export default function ReceiptsRouter(app: Application): void {
  app.get(`${baseUrl}`, [validToken, validUserTokenAffiliation, validReceiptsRequest, receipts])
}
