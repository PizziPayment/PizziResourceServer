import { Application } from 'express'
import { register, deleteAccount } from './controllers/user.auth.controller'
const baseUrl = '/auth'
const userBaseUrl = `${baseUrl}/users`

export default function AuthenticationRouter(app: Application): void {
    app.post(`${userBaseUrl}/`, [register])
    app.delete(`${userBaseUrl}/`, [deleteAccount])
}
