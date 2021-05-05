import { Request, Response } from 'express'

export function register(req: Request, res: Response): void {
    res.status(501).send()
}

export function login(req: Request, res: Response): void {
    res.status(501).send()
}

export function deleteAccount(req: Request, res: Response): void {
    res.status(501).send()
}
