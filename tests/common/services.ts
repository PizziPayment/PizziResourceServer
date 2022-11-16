import {
  ClientsService,
  CredentialModel,
  CredentialsService,
  EncryptionService,
  ShopModel,
  ShopsServices,
  TokenModel,
  TokensService,
  UserModel,
  UsersServices,
} from 'pizzi-db'
import UserRegisterRequestModel from '../../app/user/models/register.request.model'
import ShopRegisterRequestModel from '../../app/shop/models/register.request.model'
import { shops, client } from './models'

async function getUserCredentials(email: string, password: string): Promise<CredentialModel> {
  return (await CredentialsService.getCredentialFromEmailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
}

export async function getUser(email: string, password: string): Promise<UserModel> {
  const credentials = await getUserCredentials(email, password)

  return (await UsersServices.getUserFromId(credentials.user_id as number))._unsafeUnwrap()
}

export async function getUserToken(email: string, password: string, access_token_expired_at?: Date): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = await getUserCredentials(email, password)
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle.id, credentials.id, access_token_expired_at))._unsafeUnwrap()

  return token
}

export async function createUser(user: UserRegisterRequestModel): Promise<UserModel> {
  const address = `${user.place.address} ${user.place.city}`
  const user_handle = (await UsersServices.createUser(user.name, user.surname, address, user.place.zipcode))._unsafeUnwrap()
  expect((await CredentialsService.createCredentialWithId('user', user_handle.id, user.email, EncryptionService.encrypt(user.password))).isOk()).toBeTruthy()

  return user_handle
}

export async function createShop(shop: ShopRegisterRequestModel = shops[0]): Promise<ShopModel> {
  const shop_handle = (
    await ShopsServices.createShop(shop.name, shop.phone, Number(shop.siret), shop.place.address, shop.place.city, shop.place.zipcode)
  )._unsafeUnwrap()
  expect((await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))).isOk()).toBeTruthy()

  return shop_handle
}

export async function getShopToken(email: string, password: string): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = (await CredentialsService.getCredentialFromEmailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle.id, credentials.id))._unsafeUnwrap()

  return token
}

function randomString(length: number): string {
  let ret = ''

  while (ret.length < length) {
    ret += Math.random()
      .toString(16)
      .substr(0, length - ret.length)
  }

  return ret
}

export function createRandomToken(token: string): string {
  let ret = token

  while (ret == token) {
    ret = randomString(token.length)
  }

  return ret
}

export function createBearerHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}

export async function createBearerHeaderFromCredential(email: string, password: string): Promise<{ Authorization: string }> {
  return createBearerHeader((await getShopToken(email, password)).access_token)
}
