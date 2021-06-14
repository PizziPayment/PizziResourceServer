import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

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

    @Column
    user_id?: number

    @Column
    shop_id?: number

    @Column
    admin_id?: number
}
