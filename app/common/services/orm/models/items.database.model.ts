import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript"
import Receipt from "./receipts.database.model"

interface ItemAttributes {
  id: number
  name: string
  quantity: number
  price_u: number
  receipt_id: number
}

export type ItemCreation = Omit<ItemAttributes, 'id'>

@Table({ tableName: 'items', timestamps: false })
export default class Item extends Model<ItemAttributes, ItemCreation> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  name!: string

  @Column
  quantity!: number

  @Column
  price_u!: number

  @ForeignKey(() => Receipt)
  @Column
  receipt_id!: number
}
