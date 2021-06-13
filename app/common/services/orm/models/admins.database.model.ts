import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({ tableName: 'admins', timestamps: false })
export default class Admin extends Model<Admin> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number
}
