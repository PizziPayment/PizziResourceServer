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
}

export default class ShopServices {
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
