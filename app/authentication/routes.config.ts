import { Application } from 'express'
import { login, register, deleteAccount } from './controllers/user.auth.controller'
const baseUrl = '/auth'
const userBaseUrl = `${baseUrl}/user`

export default function AuthenticationRouter(app: Application): void {
    app.post(`${userBaseUrl}/login`, [login])
    app.post(`${userBaseUrl}/register`, [register])
    app.delete(`${userBaseUrl}/`, [deleteAccount])
}
