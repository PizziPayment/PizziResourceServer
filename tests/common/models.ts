import UserRegisterRequestModel from '../../app/user/models/register.request.model'
import ShopRegisterRequestModel from '../../app/shop/models/register.request.model'

export const user: UserRegisterRequestModel = {
  name: 'toto',
  surname: 'tutu',
  email: 'toto@tutu.tata',
  password: 'gY@3Cwl4FmLlQ@HycAf',
  place: {
    address: '13 rue de la ville',
    city: 'Ville',
    zipcode: 25619,
  },
}

export const shops: Array<ShopRegisterRequestModel> = [
  {
    name: 'toto',
    email: 'toto@tutu.tete',
    password: 'gY@3Cwl4FmLlQ@HycAf',
    phone: '0652076382', // Not in the documentation yet
    siret: 43014643100019,
    place: {
      address: '13 rue de la ville',
      city: 'Ville',
      zipcode: 25619,
    },
  },
  {
    name: 'tutu',
    email: 'tutu@tutu.tttt',
    password: 'gY@3Cwl4FmLlQ@HycAf',
    phone: '0652076382', // Not in the documentation yet
    siret: 50849041400010,
    place: {
      address: '13 rue de la pioche',
      city: 'Town',
      zipcode: 91652,
    },
  },
]

export const client = { client_id: 'toto', client_secret: 'tutu' }
export const client_header = {
  Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64'),
}
