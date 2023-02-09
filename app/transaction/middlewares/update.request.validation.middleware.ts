import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { TransactionUserUpdateModel } from '../models/update.request.model'
import { UsersServices } from 'pizzi-db'

async function isValidUserId(user_id: number): Promise<boolean> {
  return (await UsersServices.getUserFromId(user_id)).isOk()
}

export async function validUpdateRequestForUser(
  req: Request<unknown, unknown, TransactionUserUpdateModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  if (!(await isValidUserId(req.body.user_id))) {
    return res.status(400).send(new ApiFailure(req.url, 'invalid "user_id"'))
  }

  next()
}
