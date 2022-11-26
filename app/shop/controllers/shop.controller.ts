import { Request, Response } from 'express'
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
import { ApiFailure } from '../../common/models/api.response.model'
import { ReceiptDetailsRequestModel } from '../../common/models/receipts.request.model'
import { createResponseHandler } from '../../common/services/error_handling'
import { compute_tax } from '../../common/services/tax'
import CreateProductReturnCertificateRequestModel from '../models/create_product_return_certificate.request.model'
import CreateTransactionRequestModel from '../models/create_transaction.request.model'
import CreateTransactionResponseModel from '../models/create_transaction.response.model'
import { DetailedReceiptModel } from '../models/detailed_receipt.model'
import InfosResponseModel from '../models/infos.response.model'
import { intoShopUpdateModel, PatchRequestModel } from '../models/patch.request.model'
import ProductReturnCertificateModel from '../models/product_return_certificate.model'
import { ReceiptListModel } from '../models/receipt_list.model'
import { FilterModel, ReceiptsListRequestModel } from '../models/receipt_list.request.model'
import RegisterRequestModel from '../models/register.request.model'
import sharp = require('sharp')
import { ResultAsync } from 'neverthrow'

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
            unit_price: product.price,
            tva_percentage: product.tva_percentage,
            warranty: product.warranty,
            eco_tax: product.eco_tax,
            discount: product.discount,
          }
        }),
        creation_date: new Date(),
        payment_type: 'card',
        total_ht: receipt.total_price,
        total_ttc: receipt.items.reduce((a, b) => a + compute_tax(b.price * b.quantity, b.tva_percentage), 0),
      }
    })
    .match((receipt) => res.status(200).send(receipt), createResponseHandler(req, res))
}

export async function createTransaction(
  req: Request<void, void, CreateTransactionRequestModel>,
  res: Response<CreateTransactionResponseModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  const body = req.body

  await ReceiptsService.createReceipt(body.total_price)
    .andThen((receipt) =>
      ReceiptItemsService.createReceiptItems(
        receipt.id,
        body.items.map((item) => ({ ...item, tva_percentage: body.tva_percentage })),
      )
        .andThen(() => TransactionsService.createPendingTransaction(receipt.id, null, res.locals.credential.shop_id, body.payment_method))
        .andThen((transaction) =>
          TransactionTokensService.createTemporaryToken(transaction.id).map((token) => {
            return { id: receipt.id, token: token.token }
          }),
        ),
    )
    .match((body) => res.status(201).send(body), createResponseHandler(req, res))
}

export async function updateAvatar(req: Request, res: Response<{ image_id: number } | ApiFailure>): Promise<void> {
  const credentials = res.locals.credential as CredentialModel
  const image = await sharp(req.file.buffer).resize(512, 512, { fit: 'cover' }).jpeg().toBuffer()

  await ShopsServices.updateAvatarFromImageId(credentials.shop_id, image).match(
    (image_id) => res.status(200).send({ image_id }),
    createResponseHandler(req, res),
  )
}

export async function receiptProductReturnCertificates(
  req: Request<{ receipt_id: number }>,
  res: Response<Array<ProductReturnCertificateModel> | ApiFailure>,
): Promise<void> {
  await ProductReturnCertificatesService.getProductReturnCertificatesFromReceiptId(req.params.receipt_id).match(
    (certificates) => res.status(200).send(certificates),
    createResponseHandler(req, res),
  )
}

export async function productReturnCertificates(
  req: Request,
  res: Response<Array<ProductReturnCertificateModel> | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  await ProductReturnCertificatesService.getProductReturnCertificatesFromShopId(res.locals.credential.shop_id).match(
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
