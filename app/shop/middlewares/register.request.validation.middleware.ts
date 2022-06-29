import { NextFunction, Request, Response } from 'express'
import RegisterRequestModel from '../models/register.request.model'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

export default function validRegisterRequest(
  req: Request<unknown, unknown, RegisterRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.name) {
      errors.push('invalid "name"')
    }
    if (!req.body.phone || !FieldValidationService.isValidPhone(req.body.phone)) {
      errors.push('invalid "phone"')
    }
    if (!req.body.email || !FieldValidationService.isValidEmail(req.body.email)) {
      errors.push('invalid "email"')
    }
    if (!req.body.password || !FieldValidationService.isValidPassword(req.body.password)) {
      errors.push('invalid "password"')
    }
    if (!req.body.siret || !FieldValidationService.isValidSiret(req.body.siret)) {
      errors.push('invalid "siret"')
    }
    if (!req.body.place || !req.body.place.address || !req.body.place.city || !req.body.place.zipcode || isNan(parseInt(req.body.place.zipcode))) {
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
