import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript"
import Shop from "./shop.database.model"
import User from "./user.database.model"

interface ReceiptAttributes {
    id: number
    price_total: number
    shop_id: number
    user_id: number
}

export type ReceiptCreation = Omit<ReceiptAttributes, 'id'>

@Table({ tableName: 'receipts', timestamps: false })
export default class Receipt extends Model<ReceiptAttributes, ReceiptCreation> {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number

  @Column
  price_total!: number

  @ForeignKey(() => Shop)
  @Column
  shop_id!: number

  @ForeignKey(() => User)
  @Column
  user_id!: number
}
