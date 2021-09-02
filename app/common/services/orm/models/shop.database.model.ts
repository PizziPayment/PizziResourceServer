import { AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript'
import Picture from './pictures.database.model'

interface ShopAttributes {
    id: number
    name: string
    phone: string
    description: string
    address: string
    zipcode: number
    logo: number
    website: string
    instagram: string
    twitter: string
    facebook: string
}

export type ShopCreation = Omit<ShopAttributes, 'id'>

@Table({ tableName: 'shops', timestamps: false })
export default class Shop extends Model<ShopAttributes, ShopCreation> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id!: number

    @Column
    name!: string

    @Column
    phone!: string

    @Column
    description!: string

    @Column
    address!: string

    @Column
    zipcode!: number

    @Column
    @ForeignKey(() => Picture)
    logo?: number

    @Column
    website?: string

    @Column
    instagram?: string

    @Column
    twitter?: string

    @Column
    facebook?: string
}
