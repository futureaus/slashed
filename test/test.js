'use strict'

var slashed = require('../lib/application')
var app = new slashed(__dirname)

var router = new slashed.Router()
var router2 = new slashed.Router()


router.get('', async ctx => {
    ctx.body = 'test'
})

router2.get('', async ctx =>{
    ctx.body = 'test2'
})

router.use('/test', router2.routes())

app.use(router.routes())

async function start(){
    app.listen(app.get('port'))
}

start()
