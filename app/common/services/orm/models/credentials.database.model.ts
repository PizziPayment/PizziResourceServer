import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'
import Admin from './admins.database.model'
import Shop from './shop.database.model'
import User from './user.database.model'

interface CredentialAttributes {
    id: number
    email: string
    password: string
    user_id?: number
    shop_id?: number
    admin_id?: number
}

export type CredentialCreation = Omit<CredentialAttributes, 'id'>

@Table({ tableName: 'credentials', timestamps: false })
export default class Credential extends Model<CredentialAttributes, CredentialCreation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number

    @Column
    email!: string

    @Column
    password!: string

    @ForeignKey(() => User)
    @Column
    user_id?: number

    @ForeignKey(() => Shop)
    @Column
    shop_id?: number

    @ForeignKey(() => Admin)
    @Column
    admin_id?: number
}
