import { Request, Response } from 'express'
import { ApiFailure } from '../../common/models/api.response.model'
import {
  CredentialsService,
  EncryptionService,
  ShopsServices,
  CredentialModel,
  TransactionsService,
  ReceiptsService,
  ReceiptItemsService,
  TransactionTokensService,
} from 'pizzi-db'
import InfosResponseModel from '../models/infos.response.model'
import { ReceiptDetailsRequestModel, ReceiptsListRequestModel } from '../../common/models/receipts.request.model'
import { ReceiptListModel } from '../models/receipt_list.model'
import { DetailedReceiptModel } from '../models/detailed_receipt.model'
import RegisterRequestModel from '../models/register.request.model'
import { intoShopUpdateModel, PatchRequestModel } from '../models/patch.request.model'
import CreateTransactionRequestModel from '../models/create_transaction.request.model'
import { combine } from 'neverthrow'
import CreateTransactionResponseModel from '../models/create_transaction.response.model'

export async function shopInfo(req: Request, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await ShopsServices.getShopFromId(credentials.shop_id).match(
    (shop) => res.status(200).send(new InfosResponseModel(credentials.email, shop)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
  await ShopsServices.createShop(req.body.name, req.body.phone, Number(req.body.siret), req.body.place.address, req.body.place.city, req.body.place.zipcode)
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

export async function receipts(
  req: Request<unknown, unknown, ReceiptsListRequestModel>,
  res: Response<ReceiptListModel | ApiFailure, { credential: CredentialModel }>,
): Promise<void> {
  await TransactionsService.getOwnerTransactionsByState('shop', res.locals.credential.shop_id, 'validated')
    .andThen((transactions) =>
      ReceiptsService.getShortenedReceipts(transactions.map((t) => t.receipt_id)).map((receipts) =>
        receipts.map((receipt) => {
          return {
            receipt_id: receipt.id,
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
  await ReceiptsService.getDetailedReceiptById(req.params.receipt_id)
    .map((receipt) => {
      return {
        products: receipt.items.map((product) => {
          return {
            product_name: product.name,
            quantity: product.quantity,
            price_unit: Number(product.price),
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
    })
    .match(
      (receipt) => res.status(200).send(receipt),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
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
    .match(
      (body) => res.status(201).send(body),
      () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
    )
}
