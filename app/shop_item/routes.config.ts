import { Application } from 'express'
import validToken from '../common/middlewares/token.validation.middleware'
import { baseUrl as shopBaseUrl } from '../shop/routes.config'
import validShopTokenAffiliation from '../common/middlewares/shop_token_affiliation.validation.middleware'
import { createShopItems, retrieveShopItems, updateShopItem, deleteShopItem } from './controllers/shop_item.controller'
import { validShopItemsCreation } from './middlewares/create.request.validation.middleware'
import { validShopItemsRetrieval } from './middlewares/retrieve_param.validation.middleware'
import { validShopItemOwnership } from './middlewares/validOwnership.validation.middleware'
import { validShopItemUpdate } from './middlewares/update.request.validation.middleware'

export const baseUrl = `${shopBaseUrl}/me/items`

export default function ShopItemRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validShopItemsCreation, createShopItems])
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validShopItemsRetrieval, retrieveShopItems])
  app.patch(`${baseUrl}/:id`, [validToken, validShopTokenAffiliation, validShopItemOwnership, validShopItemUpdate, updateShopItem])
  app.delete(`${baseUrl}/:id`, [validToken, validShopTokenAffiliation, validShopItemOwnership, deleteShopItem])
}
