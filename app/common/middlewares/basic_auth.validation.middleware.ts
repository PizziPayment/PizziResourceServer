import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import DatabaseService from '../services/database/database.service'

export default async function validBasicAuth(
    req: Request,
    res: Response<ApiResponseWrapper<unknown>>,
    next: NextFunction
): Promise<Response | void> {
    const authorization_type = req.headers.authorization?.split(' ')

    if (authorization_type && authorization_type.length === 2 && authorization_type[0] === 'Basic') {
        const [client_id, client_secret] = new Buffer(authorization_type[1], 'base64').toString('ascii').split(':')
        const maybe_client = await DatabaseService.getClientFromIdAndSecret(client_id, client_secret)

        if (maybe_client.isOk()) {
            res.locals.client = maybe_client.value
            return next()
        } else {
            return res.status(401).send(new ApiFailure(req.url, 'Invalid client credentials'))
        }
    }
    return res.status(400).send(new ApiFailure(req.url, 'No client credentials given'))
}
