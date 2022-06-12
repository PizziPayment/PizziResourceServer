import { NextFunction, Request, Response } from 'express'
import { TypeValidator } from 'record-validator'
import { ApiFailure } from '../../common/models/api.response.model'

export function validRequestBodyFor<T>(
  validator: TypeValidator<T>,
): (req: Request<unknown, unknown, T>, res: Response, next: NextFunction) => Response | void {
  return (req, res, next) => {
    if (!req.body) {
      return res.status(400).send(new ApiFailure(req.url, 'Missing request body'))
    }

    const error = validator.test(req.body)

    if (error !== null) {
      return res.status(400).send(new ApiFailure(req.url, error))
    }

    next()
  }
}

export function validRequestQueryFor<T>(
  validator: TypeValidator<T>,
): (req: Request<unknown, unknown, unknown, T>, res: Response, next: NextFunction) => Response | void {
  return (req, res, next) => {
    if (!req.query) {
      return res.status(400).send(new ApiFailure(req.url, 'Missing query parameters'))
    }

    const error = validator.test(req.query)

    if (error !== null) {
      return res.status(400).send(new ApiFailure(req.url, error))
    }

    next()
  }
}
