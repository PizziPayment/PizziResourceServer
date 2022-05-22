import { UserModel } from 'pizzi-db'

export default class InfosResponseModel {
  constructor(user: UserModel) {
    this.id = user.id
    this.firstname = user.firstname
    this.surname = user.surname
    this.address = user.address
    this.zipcode = user.zipcode
  }

  id: number
  firstname: string
  surname: string
  address: string
  zipcode: number
}
