const Slashed = require('../index')

var app = new Slashed(__dirname)
app.servue.nodemodules = app.get('path:../node_modules')

var router = Slashed.Router()

router.get('/', async(ctx) => {
    await ctx.render('home')
})

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