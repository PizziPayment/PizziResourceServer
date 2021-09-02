import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'
import { Omit } from 'sequelize-typescript/dist/shared/types'
import Picture from './pictures.database.model'

interface UserAttributes {
    id: number
    firstname: string
    surname: string
    picture_id?: number
    address: string
    zipcode: number
}

export type UserCreation = Omit<UserAttributes, 'id'>

@Table({ tableName: 'users', timestamps: false })
export default class User extends Model<UserAttributes, UserCreation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id!: number

    @Column
    firstname!: string

    @Column
    surname!: string

    @ForeignKey(() => Picture)
    @Column
    picture_id?: number

    @Column
    address!: string

    @Column
    zipcode!: number
}
