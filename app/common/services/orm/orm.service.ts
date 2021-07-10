import { config } from '../../config'
import { Sequelize } from 'sequelize-typescript'

export const Orm = new Sequelize({
    dialect: 'postgres',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    models: [`${__dirname}/models`],
    logging: false,
})
