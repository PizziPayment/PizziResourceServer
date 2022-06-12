import { Application } from 'express'
import validToken from '../common/middlewares/token.validation.middleware'
import { baseUrl as shopBaseUrl } from '../shop/routes.config'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import { createShopItems, retrieveShopItems, updateShopItem, deleteShopItem } from './controllers/shop_item.controller'
import { validShopItemsRetrieval } from './middlewares/retrieve_param.validation.middleware'
import { validShopItemOwnership } from './middlewares/valid_ownership.validation.middleware'
import { validRequestBodyFor } from '../common/middlewares/request.validation.middleware'
import { ShopItemCreationRequestModel } from './models/create.request.model'
import { ShopItemUpdateRequestModel } from './models/update.request.model'

export const baseUrl = `${shopBaseUrl}/me/items`

export default function ShopItemRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validRequestBodyFor(ShopItemCreationRequestModel.validator), validToken, validShopTokenAffiliation, createShopItems])
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validShopItemsRetrieval, retrieveShopItems])
  app.patch(`${baseUrl}/:id`, [validRequestBodyFor(ShopItemUpdateRequestModel.validator), validToken, validShopTokenAffiliation, validShopItemOwnership, updateShopItem])
  app.delete(`${baseUrl}/:id`, [validToken, validShopTokenAffiliation, validShopItemOwnership, deleteShopItem])
}
