import { Application } from 'express'
import { validAccessToken } from '../common/middlewares/authorization.middleware'
import { validRequestBodyFor, validRequestParamsFor, validRequestQueryFor } from '../common/middlewares/request.validation.middleware'
import { validAdminTokenAffiliation } from '../common/middlewares/token_affiliation.validation.middleware'
import validUniqueClientId from '../common/middlewares/unique_client_id.validation.middleware'
import validUniqueEmail from '../common/middlewares/unique_email.validation.middleware'
import { createAdmin, createClient, createShop, deleteAdmin, deleteClient, deleteShop, getAdmins, getClients, getShops } from './controllers'
import { CreateAdminRequestModel } from './models/create_admin.request.model'
import { CreateClientRequestModel } from './models/create_client.request.model'
import CreateShopRequestModel from './models/create_shop.request.model'
import { DeleteByIdRequestModel } from './models/delete_by_id.request.model'
import { GetPageRequestModel } from './models/get_page.request.model'

export const baseUrl = '/admin'
export const baseUrlAdmins = `${baseUrl}/admins`
export const baseUrlClients = `${baseUrl}/clients`
export const baseUrlShops = `${baseUrl}/shops`

export function AdminRouter(app: Application): void {
  app.get(baseUrlAdmins, [validRequestQueryFor(GetPageRequestModel.validator), validAccessToken, validAdminTokenAffiliation, getAdmins])
  app.post(baseUrlAdmins, [validRequestBodyFor(CreateAdminRequestModel.validator), validAccessToken, validAdminTokenAffiliation, validUniqueEmail, createAdmin])
  app.post(`${baseUrlAdmins}/:id`, [validRequestParamsFor(DeleteByIdRequestModel.validator), validAccessToken, validAdminTokenAffiliation, deleteAdmin])

  app.get(baseUrlClients, [validRequestQueryFor(GetPageRequestModel.validator), validAccessToken, validAdminTokenAffiliation, getClients])
  app.post(baseUrlClients, [
    validRequestBodyFor(CreateClientRequestModel.validator),
    validAccessToken,
    validAdminTokenAffiliation,
    validUniqueClientId,
    createClient,
  ])
  app.post(`${baseUrlClients}/:id`, [validRequestParamsFor(DeleteByIdRequestModel.validator), validAccessToken, validAdminTokenAffiliation, deleteClient])

  app.get(`${baseUrlShops}`, [validRequestQueryFor(GetPageRequestModel.validator), validAccessToken, validAdminTokenAffiliation, getShops])
  app.post(`${baseUrlShops}`, [
    validRequestBodyFor(CreateShopRequestModel.validator),
    validAccessToken,
    validAdminTokenAffiliation,
    validUniqueEmail,
    createShop,
  ])
  app.post(`${baseUrlShops}/:id`, [validRequestParamsFor(DeleteByIdRequestModel.validator), validAccessToken, validAdminTokenAffiliation, deleteShop])
}
