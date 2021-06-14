import { err, ok, Result } from 'neverthrow'
import Client from '../orm/models/clients.database.model'
import ClientModel from './models/client.model'
import TokenModel from './models/token.model'
import Token from '../orm/models/tokens.database.model'
import CredentialModel from './models/credential.model'
import Credential, { CredentialCreation } from '../orm/models/credentials.database.model'
import { createHash } from 'crypto'

type DatabaseServiceResult<T> = Result<T, DatabaseServiceError>
enum DatabaseServiceError {
    OwnerNotFound,
    ClientNotFound,
    DatabaseError,
    TokenNotFound,
    DuplicatedEmail,
}

export default class DatabaseService {
    static encrypt(source: string): string {
        return createHash('sha256').update(source).digest('hex')
    }

    static async deleteCredentialFromId(credential_id: number): Promise<DatabaseServiceResult<void>> {
        try {
            const credential = await Credential.findOne({ where: { id: credential_id } })

            if (!credential) {
                return err(DatabaseServiceError.OwnerNotFound)
            } else {
                const tokens = await Token.findAll({ where: { credential_id: credential_id } })

                await Promise.all(tokens.map((tok) => tok.destroy()))
                await credential.destroy()
                return ok(null)
            }
        } catch (e) {
            console.log(e)
            return err(DatabaseServiceError.DatabaseError)
        }
    }
    static async getCredentialFromId(credential_id: number): Promise<DatabaseServiceResult<CredentialModel>> {
        try {
            const credential = await Credential.findOne({ where: { id: credential_id } })

            if (!credential) {
                return err(DatabaseServiceError.OwnerNotFound)
            } else {
                return ok(credential)
            }
        } catch {
            return err(DatabaseServiceError.DatabaseError)
        }
    }

    static async getTokenFromValue(token: string): Promise<DatabaseServiceResult<TokenModel>> {
        try {
            const maybe_token = await Token.findOne({ where: { access_token: token } })

            if (!maybe_token) {
                return err(DatabaseServiceError.TokenNotFound)
            }
            return ok(maybe_token)
        } catch {
            return err(DatabaseServiceError.DatabaseError)
        }
    }

    static async getClientFromIdAndSecret(
        client_id: string,
        client_secret: string
    ): Promise<DatabaseServiceResult<ClientModel>> {
        try {
            const client = await Client.findOne({ where: { client_id: client_id, client_secret: client_secret } })

            if (!client) {
                return err(DatabaseServiceError.ClientNotFound)
            }
            return ok(client)
        } catch {
            return err(DatabaseServiceError.DatabaseError)
        }
    }

    static async createCredentialWithId(
        id_type: 'user' | 'shop' | 'admin',
        id: number,
        email: string,
        password: string
    ): Promise<DatabaseServiceResult<CredentialModel>> {
        try {
            const id_key: 'user_id' | 'shop_id' | 'admin_id' = `${id_type}_id`
            const credential_attr: CredentialCreation = {
                email: email,
                password: password,
                [id_key]: id,
            }
            const credential = await Credential.create(credential_attr)

            return ok(credential)
        } catch {
            return err(DatabaseServiceError.DatabaseError)
        }
    }

    static async isEmailUnique(email: string): Promise<DatabaseServiceResult<void>> {
        try {
            const owner = await Credential.findOne({ where: { email: email } })

            if (!owner) {
                return ok(null)
            } else {
                return err(DatabaseServiceError.DuplicatedEmail)
            }
        } catch {
            return err(DatabaseServiceError.DatabaseError)
        }
    }
}
