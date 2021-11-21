import { config } from './common/config'
import { App } from './api'
import { initOrm } from 'pizzi-db'

initOrm({
  host: config.database.host,
  name: config.database.name,
  password: config.database.password,
  port: Number(config.database.port),
  user: config.database.user,
  logging: false,
})
  .then(() => console.log('Orm synchronised'))
  .catch(() => {
    throw new Error("Can't connect to database")
  })

App.listen(config.port, () => {
  console.log(`API is listening on ${config.port}`)
})
