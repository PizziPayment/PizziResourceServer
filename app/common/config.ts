import ConfigProvider = require('config')

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
  port: number = ConfigProvider.get('port')
  database: InterfaceDatabase = {
    host: ConfigProvider.get('database.host'),
    port: ConfigProvider.get('database.port'),
    name: ConfigProvider.get('database.name'),
    user: ConfigProvider.get('database.user'),
    password: ConfigProvider.get('database.password'),
  }
}

export const config = new Config()
