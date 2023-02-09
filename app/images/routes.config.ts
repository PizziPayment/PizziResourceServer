import { Application } from 'express'
import { get } from './images.controller'

export const baseUrl = '/imgs'

export default function ImagesRouter(app: Application): void {
  app.get(`${baseUrl}/:id`, [get])
}
