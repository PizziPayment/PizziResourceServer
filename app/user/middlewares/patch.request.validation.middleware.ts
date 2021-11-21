import { NextFunction, Request, Response } from 'express'
import { ApiResponseWrapper } from '../../common/models/api.response.model'
import PatchRequestModel from '../models/patch.request.model'

export default function validPatchRequest(
  req: Request<unknown, unknown, PatchRequestModel>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Response | void {
  // Is it really useful
  next()
}
