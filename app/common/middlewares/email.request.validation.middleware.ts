import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import ChangeEmailValidationModel from '../models/email.request.model'
import FieldValidationService from '../services/field_validation/field.validation.service'

export function validChangeEmailRequest(
  req: Request<unknown, unknown, ChangeEmailValidationModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.password) {
      errors.push('invalid "password"')
    }
    if (!req.body.new_email || !FieldValidationService.isValidEmail(req.body.new_email)) {
      errors.push('invalid "new_email"')
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
