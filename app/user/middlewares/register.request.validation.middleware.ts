import { NextFunction, Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'

function isValidEmail(email: string): boolean {
    const rule = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/

    return rule.test(email)
}

function isValidPassword(password: string): boolean {
    const rule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/

    return rule.test(password)
}

export default function validRegisterRequest(
    req: Request<unknown, unknown, RegisterRequestModel>,
    res: Response<ApiResponseWrapper<unknown>>,
    next: NextFunction
): Response | void {
    const errors: Array<string> = []

    if (req.body) {
        if (!req.body.name) {
            errors.push('invalid "name"')
        }
        if (!req.body.surname) {
            errors.push('invalid "surname"')
        }
        if (!req.body.email || !isValidEmail(req.body.email)) {
            errors.push('invalid "email"')
        }
        if (!req.body.password || !isValidPassword(req.body.password)) {
            errors.push('invalid "password"')
        }
        if (!req.body.place || !req.body.place.address || !req.body.place.city || !req.body.place.zipcode) {
            errors.push('invalid "place"')
        }
        if (errors.length === 0) {
            return next()
        } else {
            return res.status(400).send(new ApiFailure(req.url, errors.join(',')))
        }
    } else {
        return res.status(400).send(new ApiFailure(req.url, 'No login body'))
    }
}
