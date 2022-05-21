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
import ShopRegisterRequestModel from '../../app/shop/models/register.request.model'
import { shops, client } from './models'

async function getUserCredentials(email: string, password: string): Promise<CredentialModel> {
  return (await CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
}

export async function getUser(email: string, password: string): Promise<UserModel> {
  const credentials = await getUserCredentials(email, password)

  return (await UsersServices.getUserFromId(credentials.user_id))._unsafeUnwrap()
}

export async function getUserToken(email: string, password: string): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = await getUserCredentials(email, password)
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

  return token
}

export async function createShop(shop: ShopRegisterRequestModel = shops[0]): Promise<ShopModel> {
  const shop_handle = (await ShopsServices.createShop(shop.name, shop.phone, shop.siret, shop.place.address, shop.place.city, shop.place.zipcode))._unsafeUnwrap()
  expect((await CredentialsService.createCredentialWithId('shop', shop_handle.id, shop.email, EncryptionService.encrypt(shop.password))).isOk()).toBeTruthy()

  return shop_handle
}

export async function getShopToken(email: string, password: string): Promise<TokenModel> {
  let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
  let credentials = (await CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password)))._unsafeUnwrap()
  let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

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

export function createBearerHeader(token: string): Object {
  return { Authorization: `Bearer ${token}` }
}

export async function createBearerHeaderFromCredential(email: string, password: string): Promise<Object> {
  return createBearerHeader((await getShopToken(email, password)).access_token)
}
