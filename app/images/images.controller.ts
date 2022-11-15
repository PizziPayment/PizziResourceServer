import { Request, Response } from 'express'
import { ErrorCause, ImagesService } from 'pizzi-db'
import { createResponseHandler } from '../common/services/error_handling'

export async function get(req: Request<{ id: number }>, res: Response): Promise<void> {
  ImagesService.getImageById(req.params.id).match(
    (image) => res.status(200).send(image),
    createResponseHandler(req, res, [[ErrorCause.ImageNotFound, 404, 'Image not found']]),
  )
}
