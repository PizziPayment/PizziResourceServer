import { Request, Response } from 'express'
import { ErrorCause, IPizziError } from 'pizzi-db'
import { ApiFailure } from '../models/api.response.model'

export type Handler = (e: IPizziError) => any

export function createErrorHandler(handlers?: Array<[ErrorCause, Handler]>, default_handler?: Handler): (e: IPizziError) => void {
  return (error) => {
    const handler = handlers?.find((handler) => handler[0] === error.code)?.[1] || default_handler || defaultDefaultHandler

    handler(error)
  }
}

export type ResponseMatch = [ErrorCause, number, string]

const default_response_match: ResponseMatch = [ErrorCause.DatabaseError, 500, 'Internal error']

export function createResponseHandler<A, B>(
  req: Request<unknown, unknown, unknown, unknown>,
  res: Response<A | ApiFailure, B>,
  matches?: Array<ResponseMatch>,
  default_match: ResponseMatch = default_response_match,
): (error: IPizziError) => Response<A | ApiFailure> {
  return (error) => {
    const match = matches?.find((match) => match[0] === error.code) || default_match

    if (match[1] == 500) {
      console.log(error)
    }

    return responseHandler(req, res, match[1], match[2])
  }
}

export function responseHandler<A, B>(
  req: Request<unknown, unknown, unknown, unknown>,
  res: Response<A | ApiFailure, B>,
  code: number,
  message: string,
): Response<A | ApiFailure> {
  return res.status(code).send(new ApiFailure(req.url, message))
}

function defaultDefaultHandler(error: IPizziError): void {
  console.log(error)
}
