import { Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure } from '../../common/models/api.response.model'
import {
  CredentialModel,
  CredentialsService,
  EncryptionService,
  ReceiptItemsService,
  TokenModel,
  TransactionsService,
  UsersServices,
  ReceiptsService,
} from 'pizzi-db'
import PatchRequestModel from '../models/patch.request.model'
import InfosResponseModel from '../models/infos.response'
import { ReceiptsListRequestModel, ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { ReceiptListModel } from '../models/receipt_list.model'
import { DetailedReceiptModel } from '../models/detailed_receipt'

export async function info(req: Request, res: Response<InfosResponseModel | ApiFailure>): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await UsersServices.getUserFromId(credentials.user_id).match(
    (user) => res.status(200).send(new InfosResponseModel(user)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await UsersServices.createUser(req.body.name, req.body.surname, `${req.body.place.address}, ${req.body.place.city}`, req.body.place.zipcode)
    .andThen((user) =>
      CredentialsService.createCredentialWithId('user', user.id, req.body.email, EncryptionService.encrypt(req.body.password)).mapErr(() =>
        UsersServices.deleteUserById(user.id).match(
          () => null,
          // TODO Should be replace by a custom file logger or anything
          (e) => console.log(`Error when trying to delete User ID ${user.id}: ${e}`),
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

export async function receipts(
  req: Request<unknown, unknown, ReceiptsListRequestModel>,
  res: Response<ReceiptListModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  await TransactionsService.getOwnerTransactionsByState('user', res.locals.credential.user_id, 'validated')
    .andThen((transactions) =>
      ReceiptsService.getShortenedReceipts(transactions.map((t) => t.receipt_id)).map((receipts) =>
        receipts.map((receipt) => {
          return {
            receipt_id: receipt.id,
            shop_name: 'shop',
            shop_logo: '',
            date: new Date(),
            total_ttc: Number((Number(receipt.total_price) * ((100 + receipt.tva_percentage) / 100)).toFixed(2)),
          }
        }),
      ),
    )
    .match(
      (receipts) => res.status(200).send(receipts),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
}

export async function receipt(
  req: Request<{ receipt_id: number }, unknown, ReceiptDetailsRequestModel>,
  res: Response<DetailedReceiptModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  ReceiptsService.getDetailedReceiptById(req.params.receipt_id)
    .andThen((receipt) =>
      ReceiptItemsService.getReceiptItems(req.params.receipt_id).map((items) => {
        return {
          vendor: {
            logo: '',
            name: 'shop',
            address: { street: '', city: '', postalCode: '' },
            siret: '',
            shop_number: '',
          },
          products: items.map((product) => {
            return {
              product_name: '',
              quantity: product.quantity,
              price_unit: 0,
              warranty: product.warranty,
              eco_tax: product.eco_tax,
              discount: product.discount,
            }
          }),
          creation_date: new Date(),
          payment_type: 'card',
          tva_percentage: receipt.tva_percentage,
          total_ht: Number(receipt.total_price),
          total_ttc: Number((Number(receipt.total_price) * (1 + receipt.tva_percentage / 100)).toFixed(2)),
        }
      }),
    )
    .match(
      (receipt) => res.status(200).send(receipt),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
}
