import * as express from 'express'
import * as bodyParser from 'body-parser'

import UserRouter from './user/routes.config'
import ShopRouter from './shop/routes.config'

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
    res.header('Access-Control-Expose-Headers', 'Content-Length')
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range')
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    } else {
        return next()
    }
})

UserRouter(app)
ShopRouter(app)

export const App = app;
