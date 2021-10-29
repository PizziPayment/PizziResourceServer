import Config from './common/config/env.config'
import { App } from './api'
import { initOrm } from 'pizzi-db'

initOrm({
    host: Config.database.host,
    name: Config.database.name,
    password: Config.database.password,
    port: Number(Config.database.port),
    user: Config.database.user,
    logging: false,
})
    .then(() => console.log('Orm synchronised'))
    .catch(() => {
        throw new Error("Can't connect to database")
    })

App.listen(Config.apiPort, () => {
    console.log(`API is listening on ${Config.apiPort}`)
})
