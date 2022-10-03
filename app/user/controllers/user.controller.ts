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
  ShopsServices,
  Filter,
  ReceiptsQueryParameters,
  SharedReceiptsService,
  ErrorCause,
} from 'pizzi-db'
import PatchRequestModel from '../models/patch.request.model'
import InfosResponseModel from '../models/infos.response'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { FilterModel, ReceiptsListRequestModel } from '../models/receipt_list.request.model'
import { ReceiptListResponseModel } from '../models/receipt_list.response.model'
import { DetailedReceiptModel } from '../models/detailed_receipt'
import { siretLength } from '../../common/constants'
import TakeTransactionRequestModel from '../models/take_transaction.request.model'
import { createResponseHandler } from '../../common/services/error_handling'
import ShareReceiptRequestModel from '../models/share_receipt.request.model'

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

    const filters: Record<FilterModel, Filter> = {
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
    .map((transactions) =>
      transactions.map((transaction) => {
        return {
          receipt_id: transaction.receipt.id,
          shop_name: transaction.shop.name,
          shop_logo: transaction.shop.logo?.toString() || '',
          date: transaction.created_at,
          total_ttc: compute_tax(transaction.receipt.total_ht, transaction.receipt.tva_percentage),
        }
      }),
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
                logo: shop.logo?.toString() || '',
                name: shop.name,
                place: { street: shop.address, city: shop.city, postal_code: shop.zipcode },
                siret: String(shop.siret).padStart(siretLength, '0'),
                shop_number: shop.phone,
              },
              products: items.map((product) => {
                return {
                  product_name: product.name,
                  quantity: product.quantity,
                  price_unit: product.price,
                  warranty: product.warranty,
                  eco_tax: product.eco_tax,
                  discount: product.discount,
                }
              }),
              creation_date: transaction.created_at,
              payment_type: transaction.payment_method,
              tva_percentage: receipt.tva_percentage,
              total_ht: receipt.total_price,
              total_ttc: compute_tax(receipt.total_price, receipt.tva_percentage),
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

function compute_tax(price: number, tax_percentage: number): number {
  return Math.round(price + price * tax_percentage)
}
