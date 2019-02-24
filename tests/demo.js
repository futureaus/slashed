const Slashed = require('../index')

var app = new Slashed(__dirname)

var router = Slashed.Router()
var router2 = Slashed.Router()

router2.get('/', async(ctx) => {
    ctx.body = 'hello'
})

router.use(router2)

app.use(router)

app.listen(8000)

/** Code for HTTPS
let options
if(os.platform() == 'linux'){
    options = {
        key: fs.readFileSync("/etc/letsencrypt/live/" + app.get('app.domain') + "/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/" + app.get('app.domain') + "/fullchain.pem")
    }
}
if(options){
    https.createServer(options, app).listen(443)
}
*/