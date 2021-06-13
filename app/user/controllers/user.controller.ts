import { Request, Response } from 'express'
import UserServices from '../services/user.services'
import RegisterRequestModel from '../models/register.request.model'
import DatabaseService from '../../common/services/database/database.service'
import { ApiFailure } from '../../common/models/api.response.model'

export async function register(req: Request<unknown, unknown, RegisterRequestModel>, res: Response): Promise<void> {
    const user = await UserServices.createUser(req.body.name, req.body.surname, `${req.body.place.address} ${req.body.place.city}`, req.body.place.zipcode)

    if (user.isOk()) {
        const credentials = await DatabaseService.createCredentialWithId('user', user.value.id, req.body.email, DatabaseService.crypt(req.body.password))

        if (credentials.isOk()) {
            res.status(201).send()
        }
    } else {
        res.status(500).send(new ApiFailure(req.url, 'Internal error'))
    }
}

export function deleteAccount(req: Request, res: Response): void {
    res.status(501).send()
}
