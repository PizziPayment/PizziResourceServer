import { NextFunction, Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'

export default function validDeleteRequest(
  req: Request<unknown, unknown, RegisterRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.password) {
      errors.push('invalid "password"')
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
