import { Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure } from '../../common/models/api.response.model'
import { CredentialsService, EncryptionService, UsersServices, TokenModel } from 'pizzi-db'

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await UsersServices.createUser(req.body.name, req.body.surname, `${req.body.place.address} ${req.body.place.city}`, req.body.place.zipcode)
    .andThen((user) =>
      CredentialsService.createCredentialWithId('user', user.id, req.body.email, EncryptionService.encrypt(req.body.password)).mapErr(() =>
        UsersServices.deleteUserById(user.id).match(
          () => null,
          // TODO Should be replace by a custom file logger or anything
          (e) => console.log(`Error when trying to delete Shop ID ${user.id}: ${e}`),
        ),
      ),
    )
    .match(
      () => res.status(201).send(),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
}

export async function deleteAccount(req: Request<unknown, unknown, TokenModel>, res: Response<unknown, Record<string, TokenModel>>): Promise<void> {
  await CredentialsService.deleteCredentialFromId(res.locals.token.credential_id).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function changeUserInformation(req: Request<unknown, unknown, TokenModel>, res: Response<unknown, Record<string, TokenModel>>): Promise<void> {
  res.status(200).send(res.locals.token.credential_id)
}
