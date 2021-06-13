import { err, ok, Result } from 'neverthrow'
import UserModel from './models/user.model'
import User from '../../common/services/orm/models/user.database.model'

type UserServiceResult<T> = Result<T, UserServiceError>
enum UserServiceError {
    DuplicatedEmail,
    OwnerNotFound,
    ClientNotFound,
    DatabaseError,
    TokenNotFound,
}

export default class UserServices {
    static async createUser(name: string, surname: string, address: string, zipcode: number): Promise<UserServiceResult<UserModel>> {
        try {
            const user = await User.create({ address: address, firstname: name, surname: surname, zipcode: zipcode, picture_id: null })

            return ok(user)
        } catch {
            return err(UserServiceError.DatabaseError)
        }
    }
}
