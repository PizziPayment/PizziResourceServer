import { ShopItemSortBy as DBSortBy, Order as DBOrder } from 'pizzi-db'

export enum SortBy {
  DATE = 'date',
  NAME = 'name',
  PRICE = 'price',
}

export function intoDBSortBy(value: SortBy): DBSortBy {
  switch (value) {
    case SortBy.DATE:
      return DBSortBy.DATE
    case SortBy.NAME:
      return DBSortBy.NAME
    case SortBy.PRICE:
      return DBSortBy.PRICE
  }
}

export enum Order {
  ASC = 'asc',
  DESC = 'desc',
}

export function intoDBOrder(value: Order): DBOrder {
  switch (value) {
    case Order.ASC:
      return DBOrder.ASC
    case Order.DESC:
      return DBOrder.DESC
  }
}

export class Filter {
  constructor() {
    return {
      sort_by: SortBy.NAME,
      order: Order.ASC,
      page: 1,
      nb_items: 25,
      query: '',
    }
  }

  sort_by?: SortBy
  order?: Order
  page?: number
  nb_items?: number
  query?: string
}
