import { Request, Response } from 'express'
import {
  CredentialModel,
  CredentialsService,
  EncryptionService,
  ErrorCause,
  Filter,
  ReceiptItemsService,
  ReceiptsQueryParameters,
  SharedReceiptsService,
  ShopsServices,
  TokenModel,
  TransactionsService,
  UsersServices,
  ReceiptsService,
} from 'pizzi-db'
import { siretLength } from '../../common/constants'
import { ApiFailure } from '../../common/models/api.response.model'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { createResponseHandler } from '../../common/services/error_handling'
import { compute_tax } from '../../common/services/tax'
import { DetailedReceiptModel } from '../models/detailed_receipt'
import InfosResponseModel from '../models/infos.response'
import PatchRequestModel from '../models/patch.request.model'
import { ReceiptListFilterModel, ReceiptsListRequestModel } from '../models/receipt_list.request.model'
import { ReceiptListResponseModel } from '../models/receipt_list.response.model'
import RegisterRequestModel from '../models/register.request.model'
import ShareReceiptRequestModel from '../models/share_receipt.request.model'
import TakeTransactionRequestModel from '../models/take_transaction.request.model'
import sharp = require('sharp')
import { DetailedSharedReceiptModel } from '../models/shared_receipt.response.model'
import { ResultAsync } from 'neverthrow'
import { SharedReceiptListFilterModel, SharedReceiptsListRequestModel } from '../models/shared_receipt.request.model'

export async function info(req: Request, res: Response<InfosResponseModel | ApiFailure>): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await UsersServices.getUserFromId(credentials.user_id).match((user) => res.status(200).send(new InfosResponseModel(user)), createResponseHandler(req, res))
}

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await UsersServices.createUser(req.body.name, req.body.surname, `${req.body.place.address}, ${req.body.place.city}`, req.body.place.zipcode)
    .andThen((user) =>
      CredentialsService.createCredentialWithId('user', user.id, req.body.email, EncryptionService.encrypt(req.body.password)).mapErr(() =>
        UsersServices.deleteUserById(user.id),
      ),
    )
    .match(() => res.status(201).send(), createResponseHandler(req, res))
}

export async function deleteAccount(req: Request, res: Response<unknown, { token: TokenModel }>): Promise<void> {
  await CredentialsService.deleteCredentialFromId(res.locals.token.credential_id).match(() => res.status(204).send(), createResponseHandler(req, res))
}

export async function changeUserInformation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<unknown, { token: TokenModel; credential: CredentialModel }>,
): Promise<void> {
  const address = req.body.place && req.body.place.address && req.body.place.city ? `${req.body.place.address}, ${req.body.place.city}` : undefined

  await UsersServices.updateUserFromId(res.locals.credential.user_id, req.body.name, req.body.surname, address, req.body.place?.zipcode).match(
    (user) => res.status(200).send(user),
    createResponseHandler(req, res),
  )
}

export async function receipts(
  req: Request<unknown, unknown, unknown, ReceiptsListRequestModel>,
  res: Response<ReceiptListResponseModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  const createParams = (query?: ReceiptsListRequestModel): ReceiptsQueryParameters => {
    if (!query) {
      return {}
    }

    const filters: Record<ReceiptListFilterModel, Filter> = {
      latest: Filter.Latest,
      oldest: Filter.Oldest,
      price_ascending: Filter.PriceAscending,
      price_descending: Filter.PriceDescending,
    }
    const params: ReceiptsQueryParameters = {}

    if (query.filter) {
      params.filter = filters[query.filter]
    }
    if (query.query) {
      params.query = query.query
    }
    if (query.from) {
      params.from = new Date(query.from)
    }
    if (query.to) {
      params.to = new Date(query.to)
    }

    return params
  }

  await TransactionsService.getOwnerExpandedTransactionsByState('user', res.locals.credential.user_id, 'validated', createParams(req.query))
    .andThen((transactions) =>
      ResultAsync.combine(
        transactions.map((transaction) =>
          ReceiptItemsService.getDetailedReceiptItems(transaction.receipt.id).map((items) => ({
            receipt_id: transaction.receipt.id,
            shop_name: transaction.shop.name,
            shop_avatar_id: transaction.shop.avatar_id,
            date: transaction.created_at,
            total_ttc: items.reduce((a, b) => a + compute_tax(b.price * b.quantity, b.tva_percentage), 0),
          })),
        ),
      ),
    )
    .match((receipts) => res.status(200).send(receipts), createResponseHandler(req, res))
}

export async function shareReceipt(req: Request<{ receipt_id: number }, unknown, ShareReceiptRequestModel>, res: Response): Promise<void> {
  SharedReceiptsService.shareReceiptByEmail(req.params.receipt_id, req.body.recipient_email).match(
    () => res.status(204).send(),
    createResponseHandler(req, res, [[ErrorCause.CredentialNotFound, 400, 'Invalid recipient_email']]),
  )
}

export async function receipt(
  req: Request<{ receipt_id: number }, unknown, ReceiptDetailsRequestModel>,
  res: Response<DetailedReceiptModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  ReceiptsService.getDetailedReceiptById(req.params.receipt_id)
    .andThen((receipt) => {
      return TransactionsService.getTransactionByReceiptId(receipt.id).andThen((transaction) => {
        return ShopsServices.getShopFromId(transaction.shop_id).andThen((shop) => {
          return ReceiptItemsService.getDetailedReceiptItems(req.params.receipt_id).map((items) => {
            return {
              vendor: {
                avatar_id: shop.avatar_id,
                name: shop.name,
                place: { street: shop.address, city: shop.city, postal_code: shop.zipcode },
                siret: String(shop.siret).padStart(siretLength, '0'),
                shop_number: shop.phone,
              },
              products: items.map((product) => {
                return {
                  product_name: product.name,
                  quantity: product.quantity,
                  unit_price: product.price,
                  tva_percentage: product.tva_percentage,
                  warranty: product.warranty,
                  eco_tax: product.eco_tax,
                  discount: product.discount,
                }
              }),
              creation_date: transaction.created_at,
              payment_type: transaction.payment_method,
              total_ht: receipt.total_price,
              total_ttc: items.reduce((a, b) => a + compute_tax(b.price * b.quantity, b.tva_percentage), 0),
            }
          })
        })
      })
    })
    .match((receipt) => res.status(200).send(receipt), createResponseHandler(req, res))
}

export async function takeTransaction(
  req: Request<void, void, TakeTransactionRequestModel>,
  res: Response<DetailedReceiptModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  await TransactionsService.updateTransactionUserIdFromId(req.body.id, res.locals.credential.user_id)
    .andThen(() => TransactionsService.updateTransactionStateFromId(req.body.id, 'validated'))
    .match(() => res.status(204).send(), createResponseHandler(req, res))
}

export async function updateAvatar(req: Request, res: Response<{ image_id: number } | ApiFailure>): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  try {
    const image = await sharp(req.file.buffer).resize(512, 512, { fit: 'cover' }).jpeg().toBuffer()
    await UsersServices.updateAvatarFromImageId(credentials.user_id, image).match(
      (image_id) => res.status(200).send({ image_id }),
      createResponseHandler(req, res),
    )
  } catch {
    res.status(400).send(new ApiFailure(req.url, 'Invalid image format'))
  }
}

export async function getSharedReceipts(
  req: Request<unknown, unknown, unknown, SharedReceiptsListRequestModel>,
  res: Response<Array<DetailedSharedReceiptModel> | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  const createParams = (query?: SharedReceiptsListRequestModel): unknown => {
    if (!query) {
      return {}
    }

    const filters: Record<SharedReceiptListFilterModel, Filter> = {
      latest: Filter.Latest,
      oldest: Filter.Oldest,
    }
    const params: ReceiptsQueryParameters = {}

    if (query.filter) {
      params.filter = filters[query.filter]
    }

    params.query = query.query

    if (query.from) {
      params.from = new Date(query.from)
    }
    if (query.to) {
      params.to = new Date(query.to)
    }

    return params
  }

  await SharedReceiptsService.getDetailedSharedReceiptsByUserId(res.locals.credential.user_id, createParams(req.query)).match(
    (shared_receipts) => res.status(200).send(shared_receipts),
    createResponseHandler(req, res),
  )
}
