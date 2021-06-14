import { err, ok, Result } from 'neverthrow'
import Shop from '../../common/services/orm/models/shop.database.model'
import ShopModel from './models/shop.model'

type ShopServiceResult<T> = Result<T, ShopServiceError>
enum ShopServiceError {
    DuplicatedEmail,
    OwnerNotFound,
    ClientNotFound,
    DatabaseError,
    TokenNotFound,
    ShopNotFound,
}

export default class ShopServices {
    static async deleteShopById(shop_id: number): Promise<ShopServiceResult<void>> {
        try {
            const shop = await Shop.findOne({ where: { id: shop_id } })

            if (!shop) {
                return err(ShopServiceError.ShopNotFound)
            } else {
                await shop.destroy()
                return ok(null)
            }
        } catch {
            return err(ShopServiceError.DatabaseError)
        }
    }
    static async createShop(name: string, phone: string, address: string, zipcode: number): Promise<ShopServiceResult<ShopModel>> {
        try {
            const shop = await Shop.create({
                address: address,
                name: name,
                phone: phone,
                description: null,
                zipcode: zipcode,
                logo: null,
                facebook: null,
                instagram: null,
                twitter: null,
                website: null,
            })

            return ok(shop)
        } catch {
            return err(ShopServiceError.DatabaseError)
        }
    }
}
