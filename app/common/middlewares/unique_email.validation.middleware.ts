import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { CredentialsService } from 'pizzi-db'

interface EmailRequest {
    email: string
}

export default async function validUniqueEmail(
    req: Request<unknown, unknown, EmailRequest>,
    res: Response<ApiResponseWrapper<unknown>>,
    next: NextFunction
): Promise<Response | void> {
    const unique_email = await CredentialsService.isEmailUnique(req.body.email)

    if (unique_email.isOk()) {
        return next()
    } else {
        return res.status(400).send(new ApiFailure(req.url, 'Email already registered'))
    }
}
