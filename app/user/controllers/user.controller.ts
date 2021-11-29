import { Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure } from '../../common/models/api.response.model'
import { CredentialModel, CredentialsService, EncryptionService, TokenModel, UsersServices } from 'pizzi-db'
import PatchRequestModel from '../models/patch.request.model'

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

export async function deleteAccount(req: Request, res: Response<unknown, Record<string, TokenModel>>): Promise<void> {
  await CredentialsService.deleteCredentialFromId(res.locals.token.credential_id).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function changeUserInformation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<unknown, Record<string, TokenModel | CredentialModel>>,
): Promise<void> {
  const address = req.body.place && req.body.place.address && req.body.place.city ? `${req.body.place.address}, ${req.body.place.city}` : undefined

  await UsersServices.updateUserFromId(
    (res.locals.credential as CredentialModel).user_id,
    req.body.name,
    req.body.surname,
    address,
    req.body.place?.zipcode,
  ).match(
    (user) => res.status(200).send(user),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
