import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { TransactionPaymentMethodUpdateModel, TransactionUserUpdateModel } from '../models/update.request.model'
import { UsersServices } from 'pizzi-db'
import FieldValidationService from '../../common/services/field_validation/field.validation.service'

async function isValidUserId(user_id: number): Promise<boolean> {
  return (await UsersServices.getUserFromId(user_id)).isOk()
}

export async function validUpdateRequestForUser(
  req: Request<unknown, unknown, TransactionUserUpdateModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.user_id || !(await isValidUserId(req.body.user_id))) {
      errors.push('invalid "user_id"')
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

export function validUpdateRequestForPaymentMethod(
  req: Request<unknown, unknown, TransactionPaymentMethodUpdateModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  const errors: Array<string> = []

  if (req.body) {
    if (!req.body.payment_method || !FieldValidationService.isValidPaymentMethod(req.body.payment_method)) {
      errors.push('invalid "payment_method"')
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
