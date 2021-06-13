import { AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript'

@Table({ tableName: 'pictures', timestamps: false })
export default class Picture extends Model<Picture> {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number

    @Column
    low_res_picture?: Buffer

    @Column
    full_res_picture?: Buffer
}
