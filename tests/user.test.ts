import { App } from '../app/api'
import * as request from 'supertest'
import { Orm } from '../app/common/services/orm/orm.service'
import Client from '../app/common/services/orm/models/clients.database.model'

const client = { client_id: 'toto', client_secret: 'tutu' }
const client_header = { Authorization: 'Basic ' + Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64') }

function get_user_token(email: string) {
    return { Bearer: `` }
}

beforeEach(async () => {
    await Orm.truncate()
    await Orm.sync()
    await Client.create(client)
})

afterAll(async () => await Orm.close())

beforeAll(async () =>  {
  await Orm.sync()
})

describe('User endpoint', () => {
    const endpoint = '/user'

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
})
