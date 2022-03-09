import { Application } from 'express'
import validToken from '../common/middlewares/token.validation.middleware'
import { baseUrl as shopBaseUrl } from '../shop/routes.config'
import validShopTokenAffiliation from '../shop/middlewares/shop_token_affiliation.validation'
import { createShopItems, retrieveShopItems } from './controllers/shop_item.controller'
import { validShopItemsRetrieval } from './middlewares/retrieve_param.validation.middleware'

export const baseUrl = `${shopBaseUrl}/me/items`

export default function ShopItemRouter(app: Application): void {
  app.post(`${baseUrl}/`, [validToken, validShopTokenAffiliation, createShopItems])
  app.get(`${baseUrl}/`, [validToken, validShopTokenAffiliation, validShopItemsRetrieval, retrieveShopItems])
}
