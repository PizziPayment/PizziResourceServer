import { App } from '../app/api'
import Config from '../app/common/config/env.config'
import * as request from 'supertest'
import { rewriteTables } from 'pizzi-db'
import { ClientsService } from 'pizzi-db'
import { CredentialsService } from 'pizzi-db'
import { TokensService } from 'pizzi-db'
import { EncryptionService } from 'pizzi-db'
import { OrmConfig } from 'pizzi-db/dist/commons/models/orm.config.model'

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = { Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64') }

async function get_user_token(email: string, password: string): Promise<string> {
    let client_handle = (await ClientsService.getClientFromIdAndSecret(client.client_id, client.client_secret))._unsafeUnwrap()
    let credentials = (await (CredentialsService.getCredentialFromMailAndPassword(email, EncryptionService.encrypt(password))))._unsafeUnwrap()
    let token = (await TokensService.generateTokenBetweenClientAndCredential(client_handle, credentials))._unsafeUnwrap()

    return token.access_token
}

function random_string(length: number): string {
    let ret = ''

    while (ret.length < length) {
        ret += Math.random().toString(16).substr(0, length - ret.length)
    }

    return ret
}

function create_random_token(token: string): string {
    let ret = token

    while (ret == token) {
        ret = random_string(token.length)
    }

    return ret
}

function create_bearer_header(token: string): Object {
    return { Authorization: `Bearer ${token}` }
}

beforeEach(async () => {
    const config = Config.database
    const orm_config: OrmConfig = {
        user: config.user,
        password: config.password,
        name: config.name,
        host: config.host,
        port: Number(config.port),
        logging: false
    }

    await rewriteTables(orm_config)
    await ClientsService.createClientFromIdAndSecret(client.client_id, client.client_secret)
})

// afterAll(async () => await Orm.close())

// beforeAll(async () => {
//     await Orm.sync()
// })

describe('User endpoint', () => {
    const endpoint = '/users'

    describe('POST request', () => {
        it('should allow the creation of a valid user', async () => {
            const res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email: 'toto@tutu.tata',
                password: 'gY@3Cwl4FmLlQ@HycAf',
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })

            expect(res.statusCode).toEqual(201)
        })

        it('should not allow the creation of multiple users with the same email', async () => {
            const first_res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email: 'toto@tutu.tata',
                password: 'gY@3Cwl4FmLlQ@HycAf',
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })
            const second_res = await request(App).post(endpoint).set(client_header).send({
                name: 'titi',
                surname: 'toto',
                email: 'toto@tutu.tata',
                password: 'gY@3Cwl4FmLlQ@HycAf',
                place:
                {
                    address: 'Somewhere',
                    city: 'Over the rainbow',
                    zipcode: '12345'
                },
            })

            expect(first_res.statusCode).toEqual(201)
            expect(second_res.statusCode).toEqual(400)
        })

        describe('should not allow the creation of a user with an invalid password', () => {
            it('shorter than 12 characters', async () => {
                const res = await request(App).post(endpoint).set(client_header).send({
                    name: 'toto',
                    surname: 'tutu',
                    email: 'toto@tutu.tata',
                    password: '@bcd3',
                    place:
                    {
                        address: '13 rue de la ville',
                        city: 'Ville',
                        zipcode: '25619'
                    },
                })

                expect(res.statusCode).toEqual(400)
            })

            it('no special character', async () => {
                const res = await request(App).post(endpoint).set(client_header).send({
                    name: 'toto',
                    surname: 'tutu',
                    email: 'toto@tutu.tata',
                    password: 'Abcd3fgh1jklmnOp',
                    place:
                    {
                        address: '13 rue de la ville',
                        city: 'Ville',
                        zipcode: '25619'
                    },
                })

                expect(res.statusCode).toEqual(400)
            })

            it('no number', async () => {
                const res = await request(App).post(endpoint).set(client_header).send({
                    name: 'toto',
                    surname: 'tutu',
                    email: 'toto@tutu.tata',
                    password: '@bcdEfghIjklmnOp',
                    place:
                    {
                        address: '13 rue de la ville',
                        city: 'Ville',
                        zipcode: '25619'
                    },
                })

                expect(res.statusCode).toEqual(400)
            })

            it('no uppercase character', async () => {
                const res = await request(App).post(endpoint).set(client_header).send({
                    name: 'toto',
                    surname: 'tutu',
                    email: 'toto@tutu.tata',
                    password: '@bcd3fgh1jklmnop',
                    place:
                    {
                        address: '13 rue de la ville',
                        city: 'Ville',
                        zipcode: '25619'
                    },
                })

                expect(res.statusCode).toEqual(400)
            })

            it('no lowercase character', async () => {
                const res = await request(App).post(endpoint).set(client_header).send({
                    name: 'toto',
                    surname: 'tutu',
                    email: 'toto@tutu.tata',
                    password: '@BCD3FGH1JKLMNOP',
                    place:
                    {
                        address: '13 rue de la ville',
                        city: 'Ville',
                        zipcode: '25619'
                    },
                })

                expect(res.statusCode).toEqual(400)
            })
        })
    })

    describe('DELETE request', () => {
        it('should allow the deletion of a user using a valid password and token', async () => {
            const email = 'toto@tutu.tata'
            const password = 'gY@3Cwl4FmLlQ@HycAf'
            const create_res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email,
                password,
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })

            expect(create_res.statusCode).toEqual(201)

            const header = create_bearer_header(await get_user_token(email, password))

            const res = await request(App).delete(endpoint).set(header).send({ password })

            expect(res.statusCode).toEqual(204)
        })

        it('should not allow the deletion of a user using an invalid token', async () => {
            const email = 'toto@tutu.tata'
            const password = 'gY@3Cwl4FmLlQ@HycAf'
            const create_res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email,
                password,
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })

            expect(create_res.statusCode).toEqual(201)

            const token = await get_user_token(email, password)
            const header = create_bearer_header(create_random_token(token))
            const res = await request(App).delete(endpoint).set(header).send({ password })

            expect(res.statusCode).toEqual(403)
        })

        it('should not allow the deletion of a user using an invalid password', async () => {
            const email = 'toto@tutu.tata'
            const password = 'gY@3Cwl4FmLlQ@HycAf'
            const invalid_password = 'non3Cwl4FmLlQ@HycAf'
            const create_res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email,
                password,
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })

            expect(create_res.statusCode).toEqual(201)

            const header = create_bearer_header(await get_user_token(email, password))
            const res = await request(App).delete(endpoint).set(header).send({ password: invalid_password })

            expect(res.statusCode).toEqual(403)
        })

        it('should not allow the deletion of a user without a password', async () => {
            const email = 'toto@tutu.tata'
            const password = 'gY@3Cwl4FmLlQ@HycAf'
            const create_res = await request(App).post(endpoint).set(client_header).send({
                name: 'toto',
                surname: 'tutu',
                email,
                password,
                place:
                {
                    address: '13 rue de la ville',
                    city: 'Ville',
                    zipcode: '25619'
                },
            })

            expect(create_res.statusCode).toEqual(201)

            const header = create_bearer_header(await get_user_token(email, password))
            const res = await request(App).delete(endpoint).set(header).send({})

            expect(res.statusCode).toEqual(403)
        })
    })
})
