import { Request, Response } from 'express'
import ShopServices from '../services/shop.services'
import RegisterRequestModel from '../models/register.request.model'
import DatabaseService from '../../common/services/database/database.service'
import { ApiFailure } from '../../common/models/api.response.model'
import TokenModel from '../../common/services/database/models/token.model'

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
    const user = await ShopServices.createShop(req.body.name, req.body.phone, `${req.body.place.address} ${req.body.place.city}`, req.body.place.zipcode)

    if (user.isOk()) {
        const credentials = await DatabaseService.createCredentialWithId('shop', user.value.id, req.body.email, DatabaseService.crypt(req.body.password))

        if (credentials.isOk()) {
            res.status(201).send()
        }
    } else {
        res.status(500).send(new ApiFailure(req.url, 'Internal error'))
    }
}

export async function deleteAccount(req: Request, res: Response<unknown, Record<string, TokenModel>>): Promise<void> {
    if ((await DatabaseService.deleteCredentialFromId(res.locals.token.credential_id)).isOk()) {
        res.status(204).send()
    }
    res.status(500).send()
}
