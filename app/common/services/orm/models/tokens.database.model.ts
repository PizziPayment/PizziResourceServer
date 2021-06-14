import { AutoIncrement, DataType, Column, Model, PrimaryKey, Table, ForeignKey } from 'sequelize-typescript'
import Client from './clients.database.model'
import Credential from './credentials.database.model'

interface TokenAttributes {
    id: number
    access_token: string
    refresh_token: string
    expires_at: Date
    client_id: number
    credential_id: number
}

export type TokenCreation = Omit<TokenAttributes, 'id'>

@Table({ tableName: 'tokens', timestamps: false })
export default class Token extends Model<TokenAttributes, TokenCreation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id!: number

    @Column
    access_token!: string

    @Column
    refresh_token!: string

    @Column(DataType.DATE)
    expires_at!: Date

    @ForeignKey(() => Client)
    @Column
    client_id!: number

    @ForeignKey(() => Credential)
    @Column
    credential_id!: number
}
