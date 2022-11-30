import { NextFunction, Request, Response } from 'express'
import { ApiFailure, ApiResponseWrapper } from '../models/api.response.model'
import { ClientsService } from 'pizzi-db'
import { createResponseHandler } from '../services/error_handling'
import { CreateClientRequestModel } from '../../admin/models/create_client.request.model'

export default async function validUniqueClientId(
  req: Request<unknown, unknown, CreateClientRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<Response | void> {
  await ClientsService.isClientIdUsed(req.body.client_id).match((exists) => {
    if (!exists) {
      next()
    } else {
      res.status(400).send(new ApiFailure(req.url, 'Client id already exists'))
    }
  }, createResponseHandler(req, res))
}
