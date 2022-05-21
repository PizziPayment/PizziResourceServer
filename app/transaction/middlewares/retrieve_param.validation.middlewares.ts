import { ApiFailure, ApiResponseWrapper } from '../../common/models/api.response.model'
import { TransactionStateQuery } from '../models/retrieve.request.model'
import { NextFunction, Request, Response } from 'express'
import { TransactionState } from 'pizzi-db/dist/transactions/models/transaction.model'

export async function validTransactionRetrievalQuery(
  req: Request<unknown, unknown, unknown, TransactionStateQuery>,
  res: Response<ApiResponseWrapper<unknown>>,
  next: NextFunction,
): Promise<void> {
  const errors: Array<string> = []
  const queryable_states: Array<TransactionState> = ['pending', 'validated', 'failed']

  if (req.query) {
    if (!queryable_states.includes(req.query.state)) {
        errors.push('invalid value for "state" query parameter')
    }
    if (errors.length === 0) {
      return next()
    } else {
      res.status(400).send(new ApiFailure(req.url, errors.join(',')))
    }
  } else {
    res.status(400).send(new ApiFailure(req.url, 'No query'))
  }
}
