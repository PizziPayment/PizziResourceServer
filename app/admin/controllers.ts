import { Request, Response } from 'express'
import { AdminModel, AdminsService, ClientModel, ClientsService, CredentialsService, EncryptionService } from 'pizzi-db'
import { ApiFailure } from '../common/models/api.response.model'
import { createResponseHandler } from '../common/services/error_handling'
import { CreateAdminRequestModel } from './models/create_admin.request.model'
import { CreateClientRequestModel } from './models/create_client.request.model'
import { DeleteByIdRequestModel } from './models/delete_by_id.request.model'
import { FinalGetPageRequestModel, GetPageRequestModel } from './models/get_page.request.model'
import { randomBytes } from 'node:crypto'

export type AdminResponseModel = { id: number; credentials_id: number; email: string }
export type ClientResponseModel = { id: number; client_id: string; client_secret: string }

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
  AdminsService.deleteAdminById(Number(req.params.id)).match(() => res.status(204).send(), createResponseHandler(req, res))
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
  await ClientsService.deleteClientById(Number(req.params.id)).match(() => res.status(204).send(), createResponseHandler(req, res))
}

function to_admin_response(db_model: AdminModel): AdminResponseModel {
  return { id: db_model.id, credentials_id: db_model.credential_id, email: db_model.email }
}

function to_client_response(db_model: ClientModel): ClientResponseModel {
  return { id: db_model.id, client_id: db_model.client_id, client_secret: db_model.client_secret }
}
