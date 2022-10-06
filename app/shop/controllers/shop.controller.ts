import { Request, Response } from 'express'
import { ApiFailure } from '../../common/models/api.response.model'
import {
  CredentialModel,
  CredentialsService,
  EncryptionService,
  Filter,
  ProductReturnCertificatesService,
  ReceiptItemsService,
  ReceiptsQueryParameters,
  ReceiptsService,
  ShopsServices,
  TransactionsService,
  TransactionTokensService,
} from 'pizzi-db'
import InfosResponseModel from '../models/infos.response.model'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { ReceiptListModel } from '../models/receipt_list.model'
import { DetailedReceiptModel } from '../models/detailed_receipt.model'
import RegisterRequestModel from '../models/register.request.model'
import { intoShopUpdateModel, PatchRequestModel } from '../models/patch.request.model'
import CreateTransactionRequestModel from '../models/create_transaction.request.model'
import CreateTransactionResponseModel from '../models/create_transaction.response.model'
import { createResponseHandler } from '../../common/services/error_handling'
import { FilterModel, ReceiptsListRequestModel } from '../models/receipt_list.request.model'
import CreateProductReturnCertificateRequestModel from '../models/create_product_return_certificate.request.model'
import ProductReturnCertificateModel from '../models/product_return_certificate.model'

export async function shopInfo(req: Request, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await ShopsServices.getShopFromId(credentials.shop_id).match(
    (shop) => res.status(200).send(new InfosResponseModel(credentials.email, shop)),
    createResponseHandler(req, res),
  )
}

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await ShopsServices.createShop(req.body.name, req.body.phone, Number(req.body.siret), req.body.place.address, req.body.place.city, req.body.place.zipcode)
    .andThen((shop) =>
      CredentialsService.createCredentialWithId('shop', shop.id, req.body.email, EncryptionService.encrypt(req.body.password)).mapErr(() =>
        ShopsServices.deleteShopById(shop.id),
      ),
    )
    .match(() => res.status(201).send(), createResponseHandler(req, res))
}

export async function deleteAccount(req: Request, res: Response<unknown, Record<string, CredentialModel>>): Promise<void> {
  const credential = res.locals.credential as CredentialModel

  await CredentialsService.deleteCredentialFromId(credential.id).match(() => res.status(204).send(), createResponseHandler(req, res))
}

export async function changeShopInformation(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<unknown, Record<string, CredentialModel>>,
): Promise<void> {
  const credential = res.locals.credential

  await ShopsServices.updateShopFromId(credential.shop_id, intoShopUpdateModel(req.body)).match(
    (shop) => res.status(200).send(new InfosResponseModel(credential.email, shop)),
    createResponseHandler(req, res),
  )
}

export async function receipts(
  req: Request<unknown, unknown, ReceiptsListRequestModel>,
  res: Response<ReceiptListModel | ApiFailure, { credential: CredentialModel }>,
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
    if (query.from) {
      params.from = new Date(query.from)
    }
    if (query.to) {
      params.to = new Date(query.to)
    }

    return params
  }

  await TransactionsService.getOwnerExpandedTransactionsByState('shop', res.locals.credential.shop_id, 'validated', createParams(req.query))
    .map((transactions) =>
      transactions.map((transaction) => {
        return {
          receipt_id: transaction.receipt.id,
          date: transaction.created_at,
          total_ttc: compute_tax(transaction.receipt.total_ht, transaction.receipt.tva_percentage),
        }
      }),
    )
    .match((receipts) => res.status(200).send(receipts), createResponseHandler(req, res))
}

export async function receipt(
  req: Request<{ receipt_id: number }, unknown, ReceiptDetailsRequestModel>,
  res: Response<DetailedReceiptModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  await ReceiptsService.getDetailedReceiptById(req.params.receipt_id)
    .map((receipt) => {
      return {
        products: receipt.items.map((product) => {
          return {
            id: product.id,
            product_name: product.name,
            quantity: product.quantity,
            price_unit: product.price,
            warranty: product.warranty,
            eco_tax: product.eco_tax,
            discount: product.discount,
          }
        }),
        creation_date: new Date(),
        payment_type: 'card',
        tva_percentage: receipt.tva_percentage,
        total_ht: receipt.total_price,
        total_ttc: compute_tax(receipt.total_price, receipt.tva_percentage),
      }
    })
    .match((receipt) => res.status(200).send(receipt), createResponseHandler(req, res))
}

export async function createTransaction(
  req: Request<void, void, CreateTransactionRequestModel>,
  res: Response<CreateTransactionResponseModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  const body = req.body

  await ReceiptsService.createReceipt(body.tva_percentage, body.total_price)
    .andThen((receipt) =>
      ReceiptItemsService.createReceiptItems(receipt.id, body.items)
        .andThen(() => TransactionsService.createPendingTransaction(receipt.id, null, res.locals.credential.shop_id, body.payment_method))
        .andThen((transaction) =>
          TransactionTokensService.createTemporaryToken(transaction.id).map((token) => {
            return { id: receipt.id, token: token.token }
          }),
        ),
    )
    .match((body) => res.status(201).send(body), createResponseHandler(req, res))
}

function compute_tax(price: number, tax_percentage: number): number {
  return Math.round(price + price * tax_percentage)
}

export async function productReturnCertificates(
  req: Request<{ receipt_id: number }>,
  res: Response<Array<ProductReturnCertificateModel> | ApiFailure>,
): Promise<void> {
  await ProductReturnCertificatesService.getProductReturnCertificatesFromReceiptId(req.params.receipt_id).match(
    (certificates) => res.status(200).send(certificates),
    createResponseHandler(req, res),
  )
}

export async function createProductReturnCertificate(
  req: Request<void, void, CreateProductReturnCertificateRequestModel>,
  res: Response<ProductReturnCertificateModel | ApiFailure>,
): Promise<void> {
  await ProductReturnCertificatesService.createProductReturnCertificateFromReceiptItemId(req.body.receipt_item_id, req.body.reason, req.body.quantity).match(
    (certificate) => res.status(201).send(certificate),
    createResponseHandler(req, res),
  )
}
