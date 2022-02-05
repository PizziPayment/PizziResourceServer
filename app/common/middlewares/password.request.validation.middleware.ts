import { NextFunction, Request, Response } from 'express'
import RequestPasswordModel from '../models/password.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'

export default function validChangePasswordRequest(
  req: Request<unknown, unknown, RequestPasswordModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (req.body.password === undefined) {
      errors.push('invalid "password"')
    }

    if (req.body.new_password === undefined) {
      errors.push('invalid "new_password"')
    }

    if (errors.length === 0) {
      return next()
    } else {
      return res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    return res.status(400).send(new ApiFailure(req.url, 'No body'))
  }
}
