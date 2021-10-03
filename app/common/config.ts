const config_provider = require('config')

interface IConfig {
    port: number
    database: InterfaceDatabase
}

interface InterfaceDatabase {
    host: string
    port: number
    name: string
    user: string
    password: string
}

class Config implements IConfig {
    port: number = config_provider.get('port')
    database: InterfaceDatabase = {
        host: config_provider.get('database.host'),
        port: config_provider.get('database.port'),
        name: config_provider.get('database.name'),
        user: config_provider.get('database.user'),
        password: config_provider.get('database.password'),
    }
}

export const config = new Config()
