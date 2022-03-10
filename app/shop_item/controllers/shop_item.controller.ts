import { Request, Response } from 'express'
import { ShopItemCreationRequestModel } from '../models/create.request.model'
import { ShopItemsResponseModel } from '../models/response.model'
import { ShopItemsService } from 'pizzi-db'
import { CredentialModel } from 'pizzi-db'
import { ApiFailure } from '../../common/models/api.response.model'
import { Filter, intoDBOrder, intoDBSortBy } from '../models/retrieve.request.model'

export async function createShopItems(req: Request<unknown, unknown, ShopItemCreationRequestModel>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel

  await ShopItemsService.createShopItems(credentials.shop_id, req.body.items).match(
    (items) => res.status(201).send(new ShopItemsResponseModel(items)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}

export async function retrieveShopItems(req: Request<unknown, unknown, unknown, Filter>, res: Response): Promise<void> {
  const credentials = res.locals.credential as CredentialModel
  const filter = req.query

  await ShopItemsService.retrieveShopItemPage(
    credentials.shop_id,
    filter.page,
    filter.nb_items,
    intoDBSortBy(filter.sort_by),
    intoDBOrder(filter.order),
    filter.query,
  ).match(
    (items) => res.status(200).send(new ShopItemsResponseModel(items)),
    () => res.status(500).send(new ApiFailure(req.url, 'Internal error')),
  )
}
