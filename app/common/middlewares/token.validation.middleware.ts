import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import DatabaseService from '../services/database/database.service'

export default async function validToken(
    req: Request,
    res: Response<ApiResponseWrapper<unknown>>,
    next: NextFunction
): Promise<Response | void> {
    const authorization_type = req.headers.authorization?.split(' ')

    if (authorization_type && authorization_type.length === 2 && authorization_type[0] === 'Bearer') {
        const access_token = authorization_type[1]
        const maybe_token = await DatabaseService.getTokenFromValue(access_token)

        if (maybe_token.isOk()) {
            if (new Date(maybe_token.value.expires_at).getDate() > new Date().getDate()) {
                res.locals.token = maybe_token.value
                return next()
            }
        }
        return res.status(401).send(new ApiFailure(req.url, 'Invalid token'))
    }
    return res.status(400).send(new ApiFailure(req.url, 'No token given'))
}
