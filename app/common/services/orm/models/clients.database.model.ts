import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

interface ClientAttributes {
    id: number
    client_id: string
    client_secret: string
}

type ClientCreation = Omit<ClientAttributes, 'id'>

@Table({ tableName: 'clients', timestamps: false })
export default class Client extends Model<ClientAttributes, ClientCreation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number

    @Column
    client_id!: string

    @Column
    client_secret!: string
}
