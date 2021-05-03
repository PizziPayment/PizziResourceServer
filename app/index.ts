import * as express from 'express'

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`API is listening on ${port}`)
})
