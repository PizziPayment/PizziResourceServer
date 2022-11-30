import { Request, Response } from 'express'
import {
  AdminModel,
  AdminsService,
  ClientModel,
  ClientsService,
  CredentialModel,
  CredentialsService,
  EncryptionService,
  ErrorCause,
  ShopModel,
  ShopsServices,
  ShopWithCredsModel,
} from 'pizzi-db'
import { ApiFailure } from '../common/models/api.response.model'
import { createResponseHandler } from '../common/services/error_handling'
import { CreateAdminRequestModel } from './models/create_admin.request.model'
import { CreateClientRequestModel } from './models/create_client.request.model'
import { DeleteByIdRequestModel } from './models/delete_by_id.request.model'
import { FinalGetPageRequestModel, GetPageRequestModel } from './models/get_page.request.model'
import { randomBytes } from 'node:crypto'
import CreateShopRequestModel from './models/create_shop.request.model'

export type AdminResponseModel = { id: number; credentials_id: number; email: string }
export type ClientResponseModel = { id: number; client_id: string; client_secret: string }
export type ShopResponseModel = {
  id: number
  name: string
  phone: string
  description?: string
  siret: number
  address: string
  city: string
  zipcode: number
  avatar_id?: number
  website?: string
  instagram?: string
  twitter?: string
  facebook?: string
  credentials: {
    id: number
    email: string
  }
}

export async function getAdmins(req: Request<void, void, void, GetPageRequestModel>, res: Response<AdminResponseModel[] | ApiFailure>): Promise<void> {
  let params = FinalGetPageRequestModel.fromBaseModel(req.query)

  await AdminsService.getAdminsPage(params.page_nb, params.items_nb).match(
    (admins) => res.status(200).send(admins.map(to_admin_response)),
    createResponseHandler(req, res),
  )
}

export async function createAdmin(req: Request<void, void, CreateAdminRequestModel>, res: Response<AdminResponseModel | ApiFailure>): Promise<void> {
  await AdminsService.createAdmin()
    .andThen((admin_id) =>
      CredentialsService.createCredentialWithId('admin', admin_id, req.body.email, EncryptionService.encrypt(req.body.password)).map((credentials) => ({
        id: admin_id,
        credentials_id: credentials.id,
        email: credentials.email,
      })),
    )
    .match((response) => res.status(201).send(response), createResponseHandler(req, res))
}

export async function deleteAdmin(req: Request, res: Response<void | ApiFailure>): Promise<void> {
  AdminsService.deleteAdminById(Number(req.params.id)).match(
    () => res.status(204).send(),
    createResponseHandler(req, res, [[ErrorCause.InvalidAdmin, 404, `Admin ${req.params.id} not found`]]),
  )
}

export async function getClients(req: Request<void, void, void, GetPageRequestModel>, res: Response<ClientResponseModel[] | ApiFailure>): Promise<void> {
  let params = FinalGetPageRequestModel.fromBaseModel(req.query)

  await ClientsService.getClientsPage(params.page_nb, params.items_nb).match(
    (clients) => res.status(200).send(clients.map(to_client_response)),
    createResponseHandler(req, res),
  )
}

export async function createClient(req: Request<void, void, CreateClientRequestModel>, res: Response<ClientResponseModel | ApiFailure>): Promise<void> {
  const secret = randomBytes(4).toString('base64')

  await ClientsService.createClientFromIdAndSecret(req.body.client_id, secret).match(
    (client) => res.status(201).send(to_client_response(client)),
    createResponseHandler(req, res),
  )
}

export async function deleteClient(req: Request<DeleteByIdRequestModel>, res: Response<void | ApiFailure>): Promise<void> {
  await ClientsService.deleteClientById(Number(req.params.id)).match(
    () => res.status(204).send(),
    createResponseHandler(req, res, [[ErrorCause.ClientNotFound, 404, `Client ${req.params.id} not found`]]),
  )
}

export async function getShops(req: Request<void, void, void, GetPageRequestModel>, res: Response<ShopResponseModel[] | ApiFailure>): Promise<void> {
  let params = FinalGetPageRequestModel.fromBaseModel(req.query)

  await ShopsServices.getShopsPage(params.page_nb, params.items_nb).match(
    (clients) => res.status(200).send(clients.map(to_shop_response)),
    createResponseHandler(req, res),
  )
}

export async function createShop(req: Request<unknown, unknown, CreateShopRequestModel>, res: Response<ShopResponseModel | ApiFailure>): Promise<void> {
  await ShopsServices.createShop(req.body.name, req.body.phone, Number(req.body.siret), req.body.place.address, req.body.place.city, req.body.place.zipcode)
    .andThen((shop) =>
      CredentialsService.createCredentialWithId('shop', shop.id, req.body.email, EncryptionService.encrypt(req.body.password))
        .mapErr(() => ShopsServices.deleteShopById(shop.id))
        .map((credentials) => shop_and_credentials_to_shop_response(shop, credentials)),
    )
    .match((shop) => res.status(201).send(shop), createResponseHandler(req, res))
}

export async function deleteShop(req: Request, res: Response<void | ApiFailure>): Promise<void> {
  await ShopsServices.deleteShopById(Number(req.params.id)).match(
    () => res.status(204).send(),
    createResponseHandler(req, res, [[ErrorCause.ShopNotFound, 404, `Shop ${req.params.id} not found`]]),
  )
}

function to_admin_response(db_model: AdminModel): AdminResponseModel {
  return { id: db_model.id, credentials_id: db_model.credential_id, email: db_model.email }
}

function to_client_response(db_model: ClientModel): ClientResponseModel {
  return { id: db_model.id, client_id: db_model.client_id, client_secret: db_model.client_secret }
}

function to_shop_response(db_model: ShopWithCredsModel): ShopResponseModel {
  return {
    id: db_model.id,
    name: db_model.name,
    phone: db_model.phone,
    description: db_model.description,
    siret: db_model.siret,
    address: db_model.address,
    city: db_model.city,
    zipcode: db_model.zipcode,
    avatar_id: db_model.avatar_id,
    website: db_model.website,
    instagram: db_model.instagram,
    twitter: db_model.twitter,
    facebook: db_model.facebook,
    credentials: {
      id: db_model.credential.id,
      email: db_model.credential.email,
    },
  }
}

function shop_and_credentials_to_shop_response(shop: ShopModel, credentials: CredentialModel): ShopResponseModel {
  return {
    id: shop.id,
    name: shop.name,
    phone: shop.phone,
    description: shop.description,
    siret: shop.siret,
    address: shop.address,
    city: shop.city,
    zipcode: shop.zipcode,
    avatar_id: shop.avatar_id,
    website: shop.website,
    instagram: shop.instagram,
    twitter: shop.twitter,
    facebook: shop.facebook,
    credentials: {
      id: credentials.id,
      email: credentials.email,
    },
  }
}
