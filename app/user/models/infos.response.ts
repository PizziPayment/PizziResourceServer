import { UserModel } from 'pizzi-db'

export default class InfosResponseModel {
  constructor(user: UserModel) {
    this.id = user.id
    this.firstname = user.firstname
    this.surname = user.surname
    this.address = user.address
    this.zipcode = user.zipcode
    this.avatar_id = user.avatar_id
  }

  id: number
  firstname: string
  surname: string
  address: string
  zipcode: number
  avatar_id?: number
}
