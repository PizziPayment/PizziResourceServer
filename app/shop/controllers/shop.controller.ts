import { Request, Response } from 'express'
import { CredentialModel, CredentialsService, EncryptionService, ShopsServices } from 'pizzi-db'
import { ApiFailure } from '../../common/models/api.response.model'
import InfosResponseModel from '../models/infos.response.model'
import { PatchRequestModel, intoShopUpdateModel } from '../models/patch.request.model'
import RegisterRequestModel from '../models/register.request.model'

export async function shopInfo(req: Request, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await ShopsServices.getShopFromId(credentials.shop_id).match(
    (shop) => res.status(200).send(new InfosResponseModel(credentials.email, shop)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await ShopsServices.createShop(req.body.name, req.body.phone, `${req.body.place.address} ${req.body.place.city}`, req.body.place.zipcode)
    .andThen((shop) =>
      CredentialsService.createCredentialWithId('shop', shop.id, req.body.email, EncryptionService.encrypt(req.body.password)).mapErr(() =>
        ShopsServices.deleteShopById(shop.id).mapErr(
          // TODO Should be replace by a custom file logger or anything
          (e) => console.log(`Error when trying to delete Shop ID ${shop.id}: ${e}`),
        ),
      ),
    )
    .match(
      () => res.status(201).send(),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
}

export async function deleteAccount(req: Request, res: Response<unknown, Record<string, CredentialModel>>): Promise<void> {
  const credential = res.locals.credential as CredentialModel

  await CredentialsService.deleteCredentialFromId(credential.id).match(
    () => res.status(204).send(),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function changeShopInformation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<unknown, Record<string, CredentialModel>>,
): Promise<void> {
  const credential = res.locals.credential

  await ShopsServices.updateShopFromId(credential.shop_id, intoShopUpdateModel(req.body)).match(
    (shop) => res.status(200).send(new InfosResponseModel(credential.email, shop)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal, error')),
  )
}
