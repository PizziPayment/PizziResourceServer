import { NextFunction, Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import DatabaseService from '../../common/services/database/database.service'

export default async function validUniqueEmail(
    req: Request<unknown, unknown, RegisterRequestModel>,
    res: Response<ApiResponseWrapper<unknown>>,
    next: NextFunction
): Promise<Response | void> {
    const unique_email = await DatabaseService.isEmailUnique(req.body.email)

    if (unique_email.isOk()) {
        return next()
    } else {
        return res.status(400).send(new ApiFailure(req.url, 'Email already registered'))
    }
}
