import Config from './common/config/env.config'
import { App } from './api'
import { Orm } from './common/services/orm/orm.service'

Orm.authenticate()
    .then(() => console.log('Orm synchronised'))
    .catch(() => {
        throw new Error("Can't connect to database")
    })

App.listen(Config.apiPort, () => {
    console.log(`API is listening on ${Config.apiPort}`)
})
