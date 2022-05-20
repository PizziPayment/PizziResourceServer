import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { ReceiptsListRequestModel, FilterModelValues } from '../models/receipts.request.model'

export default function validReceiptsRequest(
  req: Request<unknown, unknown, ReceiptsListRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (req.body.filter && !FilterModelValues.includes(req.body.filter)) {
      errors.push('invalid "filter"')
    }
    if (req.body.query && !(typeof req.body.query === 'string')) {
      errors.push('invalid "query"')
    }
    if (req.body.time_interval && (typeof req.body.time_interval.from !== 'number' || typeof req.body.time_interval.to !== 'number')) {
      errors.push('invalid "time_interval"')
    }
    if (errors.length !== 0) {
      return res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    req.body = new ReceiptsListRequestModel()
  }
  return next()
}